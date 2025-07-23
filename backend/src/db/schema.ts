import { pgTable, serial, varchar, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in-progress', 'completed']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  mobile: varchar('mobile', { length: 20 }),
});

// Production tasks table
export const productionTasks = pgTable('production_tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('pending'),
  priority: taskPriorityEnum('priority').default('medium'),
  assignedToId: serial('assigned_to_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project tasks junction table
export const projectTasks = pgTable('project_tasks', {
  id: serial('id').primaryKey(),
  projectId: serial('project_id').references(() => projects.id),
  taskId: serial('task_id').references(() => productionTasks.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProductionTask = typeof productionTasks.$inferSelect;
export type NewProductionTask = typeof productionTasks.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
