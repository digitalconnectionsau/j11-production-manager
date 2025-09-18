import { Router } from 'express';
import { db } from '../db/index.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { jobs, projects, clients, jobStatuses } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get dashboard analytics data
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = 'day', date } = req.query;
    
    // Default to today if no date provided
    const targetDate = date ? new Date(date as string) : new Date();
    
    // Calculate date range based on period
    let startDate: Date, endDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - targetDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(targetDate.getFullYear(), 0, 1);
        endDate = new Date(targetDate.getFullYear(), 11, 31);
        break;
      default: // day
        startDate = new Date(targetDate);
        endDate = new Date(targetDate);
        break;
    }

    // Format dates to DD/MM/YYYY for comparison with job date fields
    const formatDateForComparison = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const startDateStr = formatDateForComparison(startDate);
    const endDateStr = formatDateForComparison(endDate);

    // For day period, we only check exact date match
    // For other periods, we need to check date ranges
    let dateCondition;
    if (period === 'day') {
      const targetDateStr = formatDateForComparison(targetDate);
      dateCondition = (dateField: any) => eq(dateField, targetDateStr);
    } else {
      // For ranges, we'll need to do string comparison which is tricky with DD/MM/YYYY
      // For now, let's use exact date matching and expand later
      dateCondition = (dateField: any) => eq(dateField, startDateStr);
    }

    // Get jobs with full relationship data
    const allJobsData = await db
      .select({
        jobId: jobs.id,
        projectId: jobs.projectId,
        clientId: projects.clientId,
        unit: jobs.unit,
        type: jobs.type,
        items: jobs.items,
        nestingDate: jobs.nestingDate,
        machiningDate: jobs.machiningDate,
        assemblyDate: jobs.assemblyDate,
        deliveryDate: jobs.deliveryDate,
        status: jobs.status,
        comments: jobs.comments,
        projectName: projects.name,
        clientName: clients.name,
        clientCompany: clients.company,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id));

    // Filter jobs by date in application logic (since DB date comparison is complex with DD/MM/YYYY strings)
    const isDateInRange = (dateStr: string, start: Date, end: Date) => {
      if (!dateStr) return false;
      
      const parts = dateStr.split('/');
      if (parts.length !== 3) return false;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      const jobDate = new Date(year, month, day);
      return jobDate >= start && jobDate <= end;
    };

    const filterJobsByDate = (jobs: any[], dateField: string) => {
      if (period === 'day') {
        const targetDateStr = formatDateForComparison(targetDate);
        return jobs.filter(job => job[dateField] === targetDateStr);
      } else {
        return jobs.filter(job => isDateInRange(job[dateField], startDate, endDate));
      }
    };

    // Calculate metrics
    const nestedJobs = filterJobsByDate(allJobsData, 'nestingDate');
    const machinedJobs = filterJobsByDate(allJobsData, 'machiningDate');
    const assembledJobs = filterJobsByDate(allJobsData, 'assemblyDate');
    const deliveredJobs = filterJobsByDate(allJobsData, 'deliveryDate');

    // Group by client for detailed breakdown
    const clientBreakdown = allJobsData.reduce((acc, job) => {
      if (!job.clientId || !job.projectId) return acc;
      
      const clientKey = job.clientId;
      if (!acc[clientKey]) {
        acc[clientKey] = {
          clientId: job.clientId,
          clientName: job.clientName,
          clientCompany: job.clientCompany,
          projects: {},
          totalJobs: 0,
          nested: 0,
          machined: 0,
          assembled: 0,
          delivered: 0,
        };
      }

      // Track projects under this client
      if (!acc[clientKey].projects[job.projectId]) {
        acc[clientKey].projects[job.projectId] = {
          projectId: job.projectId,
          projectName: job.projectName,
          jobCount: 0,
        };
      }
      acc[clientKey].projects[job.projectId].jobCount++;
      acc[clientKey].totalJobs++;

      // Count activities in the date range
      if (job.nestingDate && isDateInRange(job.nestingDate, startDate, endDate)) {
        acc[clientKey].nested++;
      }
      if (job.machiningDate && isDateInRange(job.machiningDate, startDate, endDate)) {
        acc[clientKey].machined++;
      }
      if (job.assemblyDate && isDateInRange(job.assemblyDate, startDate, endDate)) {
        acc[clientKey].assembled++;
      }
      if (job.deliveryDate && isDateInRange(job.deliveryDate, startDate, endDate)) {
        acc[clientKey].delivered++;
      }

      return acc;
    }, {} as any);

    // Convert projects object to array
    Object.values(clientBreakdown).forEach((client: any) => {
      client.projects = Object.values(client.projects);
    });

    const analytics = {
      period,
      date: targetDate.toISOString().split('T')[0],
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      summary: {
        nested: nestedJobs.length,
        machined: machinedJobs.length,
        assembled: assembledJobs.length,
        delivered: deliveredJobs.length,
        totalJobs: allJobsData.length,
        totalClients: Object.keys(clientBreakdown).length,
        totalProjects: new Set(allJobsData.map(job => job.projectId)).size,
      },
      clientBreakdown: Object.values(clientBreakdown),
      recentActivity: {
        nested: nestedJobs.slice(0, 10).map(job => ({
          jobId: job.jobId,
          items: job.items,
          projectName: job.projectName,
          clientName: job.clientName,
          date: job.nestingDate,
        })),
        machined: machinedJobs.slice(0, 10).map(job => ({
          jobId: job.jobId,
          items: job.items,
          projectName: job.projectName,
          clientName: job.clientName,
          date: job.machiningDate,
        })),
        assembled: assembledJobs.slice(0, 10).map(job => ({
          jobId: job.jobId,
          items: job.items,
          projectName: job.projectName,
          clientName: job.clientName,
          date: job.assemblyDate,
        })),
        delivered: deliveredJobs.slice(0, 10).map(job => ({
          jobId: job.jobId,
          items: job.items,
          projectName: job.projectName,
          clientName: job.clientName,
          date: job.deliveryDate,
        })),
      },
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get client summary with project and job counts
router.get('/clients-summary', authenticateToken, async (req, res) => {
  try {
    const clientsSummary = await db
      .select({
        clientId: clients.id,
        clientName: clients.name,
        clientCompany: clients.company,
        projectCount: sql<number>`COUNT(DISTINCT ${projects.id})`,
        jobCount: sql<number>`COUNT(${jobs.id})`,
      })
      .from(clients)
      .leftJoin(projects, eq(clients.id, projects.clientId))
      .leftJoin(jobs, eq(projects.id, jobs.projectId))
      .groupBy(clients.id, clients.name, clients.company)
      .orderBy(clients.name);

    res.json(clientsSummary);
  } catch (error) {
    console.error('Error fetching clients summary:', error);
    res.status(500).json({ error: 'Failed to fetch clients summary' });
  }
});

export default router;