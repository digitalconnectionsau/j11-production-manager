import express from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { clients, projects, jobs, jobStatuses } from '../db/schema.js';
import { verifyTokenAndPermission, type AuthenticatedRequest } from '../middleware/permissions.js';

const router = express.Router();

interface ImportJob {
  unit: string;
  type: string;
  items: string;
  project_name: string;
  client_name?: string;
  nesting?: string;
  machining?: string;
  assembly?: string;
  delivery?: string;
  status?: string;
  comments?: string;
}

interface ImportClient {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  notes?: string;
}

interface ImportProject {
  name: string;
  client_name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
}

// Helper function to find or create a client
async function findOrCreateClient(clientData: { name: string; [key: string]: any }): Promise<number> {
  // First, try to find existing client by name
  const existingClient = await db
    .select()
    .from(clients)
    .where(eq(clients.name, clientData.name))
    .limit(1);

  if (existingClient.length > 0) {
    console.log(`Found existing client: ${clientData.name} (ID: ${existingClient[0].id})`);
    return existingClient[0].id;
  }

  // Create new client if not found
  console.log(`Creating new client: ${clientData.name}`);
  const newClient = await db
    .insert(clients)
    .values({
      name: clientData.name,
      email: clientData.email || null,
      phone: clientData.phone || null,
      address: clientData.address || null,
      contactPerson: clientData.contact_person || null,
      notes: clientData.notes || null,
      isActive: true,
      archived: false,
    })
    .returning({ id: clients.id });

  console.log(`Created new client: ${clientData.name} (ID: ${newClient[0].id})`);
  return newClient[0].id;
}

// Helper function to find or create a project
async function findOrCreateProject(projectData: { name: string; client_id: number; [key: string]: any }): Promise<number> {
  // First, try to find existing project by name and client
  const existingProject = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.name, projectData.name),
      eq(projects.clientId, projectData.client_id)
    ))
    .limit(1);

  if (existingProject.length > 0) {
    console.log(`Found existing project: ${projectData.name} for client ID ${projectData.client_id} (Project ID: ${existingProject[0].id})`);
    return existingProject[0].id;
  }

  // Create new project if not found
  console.log(`Creating new project: ${projectData.name} for client ID ${projectData.client_id}`);
  const newProject = await db
    .insert(projects)
    .values({
      name: projectData.name,
      clientId: projectData.client_id,
      description: projectData.description || null,
      status: projectData.status || 'active',
    })
    .returning({ id: projects.id });

  console.log(`Created new project: ${projectData.name} (ID: ${newProject[0].id})`);
  return newProject[0].id;
}

// POST /api/import/jobs - Smart import jobs with client/project creation
router.post('/jobs', verifyTokenAndPermission('add_jobs'), async (req: AuthenticatedRequest, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    console.log(`Starting smart import of ${data.length} jobs`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      clientsCreated: 0,
      projectsCreated: 0,
      details: {
        clients: [] as Array<{ name: string; id: number; created: boolean }>,
        projects: [] as Array<{ name: string; id: number; clientName: string; created: boolean }>,
        jobs: [] as Array<{ unit: string; success: boolean; error?: string }>
      }
    };

    // Process each job
    for (let i = 0; i < data.length; i++) {
      const jobData: ImportJob = data[i];
      
      try {
        console.log(`Processing job ${i + 1}/${data.length}: ${jobData.unit || `Unnamed-${i + 1}`}`);
        
        // Use default values for missing required fields instead of skipping
        const safeJobData = {
          unit: jobData.unit || `Unnamed-${i + 1}`,
          type: jobData.type || 'Unknown',
          items: jobData.items || 'TBD',
          project_name: jobData.project_name || 'Unknown Project',
          client_name: jobData.client_name,
          nesting: jobData.nesting,
          machining: jobData.machining,
          assembly: jobData.assembly,
          delivery: jobData.delivery,
          status: jobData.status,
          comments: jobData.comments
        };

        let clientId: number;
        
        // Handle client creation/lookup
        if (safeJobData.client_name) {
          const clientsBefore = results.details.clients.length;
          clientId = await findOrCreateClient({ name: safeJobData.client_name });
          
          const existingClientRecord = results.details.clients.find(c => c.id === clientId);
          if (!existingClientRecord) {
            const wasCreated = results.details.clients.length === clientsBefore;
            results.details.clients.push({
              name: safeJobData.client_name,
              id: clientId,
              created: wasCreated
            });
            if (wasCreated) results.clientsCreated++;
          }
        } else {
          // If no client specified, we need to find or create a default client for the project
          clientId = await findOrCreateClient({ name: 'Unknown Client' });
          
          const existingClientRecord = results.details.clients.find(c => c.id === clientId);
          if (!existingClientRecord) {
            results.details.clients.push({
              name: 'Unknown Client',
              id: clientId,
              created: true
            });
            results.clientsCreated++;
          }
        }

        // Handle project creation/lookup
        const projectsBefore = results.details.projects.length;
        const projectId = await findOrCreateProject({ 
          name: safeJobData.project_name, 
          client_id: clientId 
        });
        
        const existingProjectRecord = results.details.projects.find(p => p.id === projectId);
        if (!existingProjectRecord) {
          const wasCreated = results.details.projects.length === projectsBefore;
          results.details.projects.push({
            name: safeJobData.project_name,
            id: projectId,
            clientName: safeJobData.client_name || 'Unknown Client',
            created: wasCreated
          });
          if (wasCreated) results.projectsCreated++;
        }

        // Parse dates from job data (keep as string format DD/MM/YYYY as per schema)
        const formatDate = (dateStr: string | undefined): string | null => {
          if (!dateStr) return null;
          // If already in DD/MM/YYYY format, return as is
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            return dateStr;
          }
          // Try to parse and convert to DD/MM/YYYY
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        // Get default status ID with smart status mapping
        const getStatusId = async (statusName: string = 'not-assigned'): Promise<number> => {
          // Map common status values to enum values
          const statusMapping: { [key: string]: string } = {
            'delivery complete': 'delivered',
            'delivered': 'delivered',
            'complete': 'delivered',
            'finished': 'delivered',
            'done': 'delivered',
            'assembly complete': 'assembly-complete',
            'assembly': 'assembly-complete',
            'machining complete': 'machining-complete', 
            'machining': 'machining-complete',
            'machined': 'machining-complete',
            'nesting complete': 'nesting-complete',
            'nesting': 'nesting-complete',
            'nested': 'nesting-complete',
            'not assigned': 'not-assigned',
            'unassigned': 'not-assigned',
            'pending': 'not-assigned',
            'waiting': 'not-assigned'
          };

          // Normalize the status name for lookup
          const normalizedStatus = statusName?.toLowerCase().trim() || 'not-assigned';
          const mappedStatus = statusMapping[normalizedStatus] || normalizedStatus;
          
          console.log(`Status mapping: "${statusName}" -> "${normalizedStatus}" -> "${mappedStatus}"`);
          
          const defaultStatus = await db
            .select({ id: jobStatuses.id })
            .from(jobStatuses)
            .where(eq(jobStatuses.name, mappedStatus))
            .limit(1);
          
          if (defaultStatus.length > 0) {
            return defaultStatus[0].id;
          }
          
          // Fallback: get the first status if mapped status not found  
          const firstStatus = await db
            .select({ id: jobStatuses.id })
            .from(jobStatuses)
            .limit(1);
          
          console.log(`Status "${mappedStatus}" not found, using fallback status ID: ${firstStatus.length > 0 ? firstStatus[0].id : 1}`);
          return firstStatus.length > 0 ? firstStatus[0].id : 1; // Fallback to ID 1
        };

        const statusId = await getStatusId(safeJobData.status);

        // Get the mapped status name for the enum field
        const getMappedEnumStatus = (statusName: string = 'not-assigned'): string => {
          const statusMapping: { [key: string]: string } = {
            'delivery complete': 'delivered',
            'delivered': 'delivered',
            'complete': 'delivered',
            'finished': 'delivered',
            'done': 'delivered',
            'assembly complete': 'assembly-complete',
            'assembly': 'assembly-complete',
            'machining complete': 'machining-complete',
            'machining': 'machining-complete',
            'machined': 'machining-complete',
            'nesting complete': 'nesting-complete',
            'nesting': 'nesting-complete',
            'nested': 'nesting-complete',
            'not assigned': 'not-assigned',
            'unassigned': 'not-assigned',
            'pending': 'not-assigned',
            'waiting': 'not-assigned'
          };
          const normalizedStatus = statusName?.toLowerCase().trim() || 'not-assigned';
          return statusMapping[normalizedStatus] || 'not-assigned';
        };

        // Create the job with safe data
        const newJob = await db
          .insert(jobs)
          .values({
            unit: safeJobData.unit,
            type: safeJobData.type,
            items: safeJobData.items,
            projectId: projectId,
            statusId: statusId,
            status: getMappedEnumStatus(safeJobData.status) as any, // Use mapped enum value
            nestingDate: formatDate(safeJobData.nesting),
            machiningDate: formatDate(safeJobData.machining),
            assemblyDate: formatDate(safeJobData.assembly),
            deliveryDate: formatDate(safeJobData.delivery),
            comments: safeJobData.comments || null,
          })
          .returning({ id: jobs.id });

        console.log(`Created job: ${safeJobData.unit} (ID: ${newJob[0].id})`);
        results.details.jobs.push({ unit: safeJobData.unit, success: true });
        results.success++;

      } catch (error) {
        console.error(`Error processing job ${i + 1}:`, error);
        const errorMsg = `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        results.details.jobs.push({ 
          unit: (jobData.unit || `Row ${i + 1}`), 
          success: false, 
          error: errorMsg 
        });
        results.failed++;
      }
    }

    console.log(`Import completed: ${results.success} success, ${results.failed} failed`);
    console.log(`Created: ${results.clientsCreated} clients, ${results.projectsCreated} projects`);

    res.json(results);

  } catch (error) {
    console.error('Error in jobs import:', error);
    res.status(500).json({ 
      error: 'Internal server error during import',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/import/clients - Import clients
router.post('/clients', verifyTokenAndPermission('add_clients'), async (req: AuthenticatedRequest, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      details: [] as Array<{ name: string; success: boolean; error?: string }>
    };

    for (let i = 0; i < data.length; i++) {
      const clientData: ImportClient = data[i];
      
      try {
        if (!clientData.name) {
          const error = `Row ${i + 1}: Client name is required`;
          results.errors.push(error);
          results.details.push({ name: `Row ${i + 1}`, success: false, error });
          results.failed++;
          continue;
        }

        // Check if client already exists
        const existingClient = await db
          .select()
          .from(clients)
          .where(eq(clients.name, clientData.name))
          .limit(1);

        if (existingClient.length > 0) {
          const error = `Row ${i + 1}: Client '${clientData.name}' already exists`;
          results.errors.push(error);
          results.details.push({ name: clientData.name, success: false, error });
          results.failed++;
          continue;
        }

        // Create new client
        await db
          .insert(clients)
          .values({
            name: clientData.name,
            email: clientData.email || null,
            phone: clientData.phone || null,
            address: clientData.address || null,
            contactPerson: clientData.contact_person || null,
            notes: clientData.notes || null,
            isActive: true,
            archived: false,
          });

        results.details.push({ name: clientData.name, success: true });
        results.success++;

      } catch (error) {
        const errorMsg = `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        results.details.push({ 
          name: clientData.name || `Row ${i + 1}`, 
          success: false, 
          error: errorMsg 
        });
        results.failed++;
      }
    }

    res.json(results);

  } catch (error) {
    console.error('Error in clients import:', error);
    res.status(500).json({ 
      error: 'Internal server error during import',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/import/projects - Import projects
router.post('/projects', verifyTokenAndPermission('add_projects'), async (req: AuthenticatedRequest, res) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      clientsCreated: 0,
      details: [] as Array<{ name: string; success: boolean; error?: string }>
    };

    for (let i = 0; i < data.length; i++) {
      const projectData: ImportProject = data[i];
      
      try {
        if (!projectData.name || !projectData.client_name) {
          const error = `Row ${i + 1}: Project name and client name are required`;
          results.errors.push(error);
          results.details.push({ name: `Row ${i + 1}`, success: false, error });
          results.failed++;
          continue;
        }

        // Find or create client
        const clientId = await findOrCreateClient({ name: projectData.client_name });

        // Check if project already exists for this client
        const existingProject = await db
          .select()
          .from(projects)
          .where(and(
            eq(projects.name, projectData.name),
            eq(projects.clientId, clientId)
          ))
          .limit(1);

        if (existingProject.length > 0) {
          const error = `Row ${i + 1}: Project '${projectData.name}' already exists for client '${projectData.client_name}'`;
          results.errors.push(error);
          results.details.push({ name: projectData.name, success: false, error });
          results.failed++;
          continue;
        }

        // Create new project
        await db
          .insert(projects)
          .values({
            name: projectData.name,
            clientId: clientId,
            description: projectData.description || null,
            status: projectData.status || 'active',
          });

        results.details.push({ name: projectData.name, success: true });
        results.success++;

      } catch (error) {
        const errorMsg = `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        results.details.push({ 
          name: projectData.name || `Row ${i + 1}`, 
          success: false, 
          error: errorMsg 
        });
        results.failed++;
      }
    }

    res.json(results);

  } catch (error) {
    console.error('Error in projects import:', error);
    res.status(500).json({ 
      error: 'Internal server error during import',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;