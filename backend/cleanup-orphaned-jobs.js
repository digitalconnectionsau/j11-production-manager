import { db } from './src/db/index.js';
import { jobs, projects } from './src/db/schema.js';
import { notInArray } from 'drizzle-orm';

async function cleanupOrphanedJobs() {
  try {
    console.log('=== CLEANING UP ORPHANED JOBS ===\n');
    
    // Get all existing project IDs
    const existingProjects = await db.select({ id: projects.id }).from(projects);
    const existingProjectIds = existingProjects.map(p => p.id);
    
    console.log(`Existing projects: ${existingProjectIds.length}`);
    
    if (existingProjectIds.length === 0) {
      // If no projects exist, delete all jobs
      const deletedJobs = await db.delete(jobs).returning();
      console.log(`Deleted all ${deletedJobs.length} orphaned jobs`);
    } else {
      // Delete jobs that reference non-existent projects
      const deletedJobs = await db.delete(jobs)
        .where(notInArray(jobs.projectId, existingProjectIds))
        .returning();
      console.log(`Deleted ${deletedJobs.length} orphaned jobs`);
    }
    
    // Check final count
    const remainingJobs = await db.select().from(jobs);
    console.log(`Remaining jobs: ${remainingJobs.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

cleanupOrphanedJobs();