import { db } from './src/db/index.js';
import { jobs, projects, clients } from './src/db/schema.js';
import { eq, isNull } from 'drizzle-orm';

async function checkOrphanedJobs() {
  try {
    console.log('=== CHECKING FOR ORPHANED JOBS ===\n');
    
    // Get total job count
    const allJobs = await db.select().from(jobs);
    console.log(`Total jobs in database: ${allJobs.length}`);
    
    // Check jobs with null projectId
    const jobsWithNullProject = await db.select().from(jobs).where(isNull(jobs.projectId));
    console.log(`Jobs with NULL project_id: ${jobsWithNullProject.length}`);
    
    // Get all existing project IDs
    const existingProjects = await db.select({ id: projects.id }).from(projects);
    const existingProjectIds = existingProjects.map(p => p.id);
    console.log(`Existing projects: ${existingProjectIds.length}`);
    
    // Check for jobs with non-existent project IDs
    const orphanedJobs = [];
    for (const job of allJobs) {
      if (job.projectId && !existingProjectIds.includes(job.projectId)) {
        orphanedJobs.push(job);
      }
    }
    
    console.log(`Jobs with non-existent project IDs: ${orphanedJobs.length}`);
    
    if (orphanedJobs.length > 0) {
      console.log('\n=== ORPHANED JOBS DETAILS ===');
      orphanedJobs.slice(0, 10).forEach(job => {
        console.log(`Job ID: ${job.id}, Project ID: ${job.projectId}, Items: ${job.items}`);
      });
      if (orphanedJobs.length > 10) {
        console.log(`... and ${orphanedJobs.length - 10} more`);
      }
    }
    
    // Check existing clients count
    const allClients = await db.select().from(clients);
    console.log(`\nTotal clients in database: ${allClients.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkOrphanedJobs();