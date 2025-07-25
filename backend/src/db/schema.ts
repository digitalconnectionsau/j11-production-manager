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

// Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  contactPerson: varchar('contact_person', { length: 255 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  clientId: serial('client_id').references(() => clients.id),
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

// Pinned projects table
export const pinnedProjects = pgTable('pinned_projects', {
  id: serial('id').primaryKey(),
  projectId: serial('project_id').references(() => projects.id),
  userId: serial('user_id').references(() => users.id),
  order: serial('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type ProductionTask = typeof productionTasks.$inferSelect;
export type NewProductionTask = typeof productionTasks.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type PinnedProject = typeof pinnedProjects.$inferSelect;
export type NewPinnedProject = typeof pinnedProjects.$inferInsert;
