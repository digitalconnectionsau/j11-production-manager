import express from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clients, projects } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/clients - Get all clients
router.get('/', authenticateToken, async (req, res) => {
  try {
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
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        projectCount: sql<number>`COUNT(${projects.id})`,
      })
      .from(clients)
      .leftJoin(projects, eq(clients.id, projects.clientId))
      .groupBy(clients.id, clients.name, clients.company, clients.email, clients.phone, 
               clients.address, clients.abn, clients.contactPerson, clients.notes, clients.isActive, 
               clients.createdAt, clients.updatedAt)
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
router.get('/:id', authenticateToken, async (req, res) => {
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
router.post('/', authenticateToken, async (req, res) => {
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

    res.status(201).json(newClient[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update a client
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { name, company, email, phone, address, abn, contactPerson, notes, isActive } = req.body;

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

    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);

    // Check if client has any projects
    const clientProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, clientId));

    if (clientProjects.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with existing projects. Please reassign or delete projects first.' 
      });
    }

    const deletedClient = await db
      .delete(clients)
      .where(eq(clients.id, clientId))
      .returning();

    if (deletedClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
