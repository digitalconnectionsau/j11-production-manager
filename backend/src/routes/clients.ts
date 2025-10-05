import express from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clients, projects, jobs, contacts } from '../db/schema.js';
import { verifyTokenAndPermission, type AuthenticatedRequest } from '../middleware/permissions.js';
import { logRecordCreation, logAuditChanges, logRecordDeletion } from '../services/auditService.js';

const router = express.Router();

// GET /api/clients - Get all clients
router.get('/', verifyTokenAndPermission('view_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const { includeArchived } = req.query;
    const showArchived = includeArchived === 'true';

    const allClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        company: clients.company,
        email: clients.email,
        phone: clients.phone,
        address: clients.address,
        abn: clients.abn,
        contactPerson: clients.contactPerson,
        notes: clients.notes,
        isActive: clients.isActive,
        archived: clients.archived,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        projectCount: sql<number>`COUNT(${projects.id})`,
      })
      .from(clients)
      .leftJoin(projects, eq(clients.id, projects.clientId))
      .where(showArchived ? undefined : eq(clients.archived, false))
      .groupBy(clients.id, clients.name, clients.company, clients.email, clients.phone, 
               clients.address, clients.abn, clients.contactPerson, clients.notes, clients.isActive, 
               clients.archived, clients.createdAt, clients.updatedAt)
      .orderBy(desc(clients.createdAt));

    // Transform data for frontend
    const clientsWithMetadata = allClients.map(client => ({
      ...client,
      projects: client.projectCount || 0,
      lastContact: client.updatedAt?.toISOString().split('T')[0] || client.createdAt?.toISOString().split('T')[0],
      status: client.isActive ? 'Active' : 'Inactive'
    }));

    res.json(clientsWithMetadata);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get a specific client
router.get('/:id', verifyTokenAndPermission('view_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get projects for this client
    const clientProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt));

    // Transform data for frontend consistency
    const clientWithMetadata = {
      ...client[0],
      projects: clientProjects,
      lastContact: client[0].updatedAt?.toISOString().split('T')[0] || client[0].createdAt?.toISOString().split('T')[0],
      status: client[0].isActive ? 'Active' : 'Inactive'
    };

    res.json(clientWithMetadata);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create a new client
router.post('/', verifyTokenAndPermission('add_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, company, email, phone, address, abn, contactPerson, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const newClient = await db
      .insert(clients)
      .values({
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        abn: abn || null,
        contactPerson: contactPerson || null,
        notes: notes || null,
        isActive: true
      })
      .returning();

    // Log the creation
    await logRecordCreation(
      'clients', 
      newClient[0].id, 
      newClient[0], 
      req.user?.id,
      req.user?.email,
      req
    );

    res.status(201).json(newClient[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update a client
router.put('/:id', verifyTokenAndPermission('edit_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { name, company, email, phone, address, abn, contactPerson, notes, isActive } = req.body;

    // Get the old record before updating
    const [oldClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!oldClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updatedClient = await db
      .update(clients)
      .set({
        name,
        company,
        email,
        phone,
        address,
        abn,
        contactPerson,
        notes,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning();

    if (updatedClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log the changes
    await logAuditChanges(
      'clients',
      clientId,
      oldClient,
      updatedClient[0],
      req.user?.id,
      req.user?.email,
      req
    );

    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// PATCH /api/clients/:id/archive - Archive/unarchive a client
router.patch('/:id/archive', verifyTokenAndPermission('edit_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { archived } = req.body;

    if (typeof archived !== 'boolean') {
      return res.status(400).json({ error: 'archived field must be a boolean' });
    }

    // Get the old record before updating
    const [oldClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!oldClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updatedClient = await db
      .update(clients)
      .set({ 
        archived: archived,
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId))
      .returning();

    if (updatedClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Log the archive change
    await logAuditChanges(
      'clients',
      clientId,
      oldClient,
      updatedClient[0],
      req.user?.id,
      req.user?.email,
      req
    );

    res.json({ 
      message: `Client ${archived ? 'archived' : 'unarchived'} successfully`,
      client: updatedClient[0]
    });
  } catch (error) {
    console.error('Error archiving client:', error);
    res.status(500).json({ error: 'Failed to archive client' });
  }
});

// DELETE /api/clients/:id - Delete a client and all associated data
router.delete('/:id', verifyTokenAndPermission('delete_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);

    // Get the client record before deleting for audit logging
    const [clientToDelete] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!clientToDelete) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Start a transaction for cascading delete
    const result = await db.transaction(async (tx) => {
      // Get all projects for this client
      const clientProjects = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.clientId, clientId));

      const projectIds = clientProjects.map(p => p.id);
      console.log(`Deleting client ${clientId}: found ${projectIds.length} projects`);

      // Delete all jobs associated with client's projects
      if (projectIds.length > 0) {
        // More efficient: delete all jobs in one query using inArray
        const deletedJobs = await tx
          .delete(jobs)
          .where(sql`${jobs.projectId} = ANY(${projectIds})`)
          .returning({ id: jobs.id });
        
        console.log(`Deleted ${deletedJobs.length} jobs for client ${clientId}`);
      }

      // Delete all projects for this client
      const deletedProjects = await tx
        .delete(projects)
        .where(eq(projects.clientId, clientId))
        .returning({ id: projects.id });
      
      console.log(`Deleted ${deletedProjects.length} projects for client ${clientId}`);

      // Delete all contacts for this client
      const deletedContacts = await tx
        .delete(contacts)
        .where(eq(contacts.clientId, clientId))
        .returning({ id: contacts.id });
      
      console.log(`Deleted ${deletedContacts.length} contacts for client ${clientId}`);

      // Finally, delete the client
      const deletedClient = await tx
        .delete(clients)
        .where(eq(clients.id, clientId))
        .returning();

      if (deletedClient.length === 0) {
        throw new Error('Client not found');
      }

      console.log(`Successfully deleted client ${clientId} and all associated data`);
      return {
        client: deletedClient[0],
        deletedJobs: projectIds.length > 0 ? 'jobs deleted' : 'no jobs',
        deletedProjects: deletedProjects.length,
        deletedContacts: deletedContacts.length
      };
    });

    // Log the deletion
    await logRecordDeletion(
      'clients',
      clientId,
      clientToDelete,
      req.user?.id,
      req.user?.email,
      req
    );

    res.json({ 
      message: 'Client and all associated data deleted successfully',
      deletedClient: result.client,
      summary: {
        projects: result.deletedProjects,
        contacts: result.deletedContacts,
        jobs: result.deletedJobs
      }
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    if (error instanceof Error && error.message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
