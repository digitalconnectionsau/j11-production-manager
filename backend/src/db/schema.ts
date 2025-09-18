import { pgTable, serial, integer, varchar, text, timestamp, boolean, pgEnum, date, jsonb } from 'drizzle-orm/pg-core';

// Job statuses table for flexible status management
export const jobStatuses = pgTable('job_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(), // Hex color code
  backgroundColor: varchar('background_color', { length: 7 }).notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  isDefault: boolean('is_default').default(false),
  isFinal: boolean('is_final').default(false), // Completion status
  targetColumns: jsonb('target_columns').default('[]'), // Array of column names to target for coloring
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Keep the enum for backward compatibility during migration
export const jobStatusEnum = pgEnum('job_status', [
  'not-assigned', 
  'nesting-complete', 
  'machining-complete', 
  'assembly-complete', 
  'delivered'
]);

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
  department: varchar('department', { length: 100 }),
  position: varchar('position', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true),
  isBlocked: boolean('is_blocked').default(false),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Permissions table
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 150 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Roles table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  isSuperAdmin: boolean('is_super_admin').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Role permissions junction table
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// User roles junction table
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: integer('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

// Clients table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // Quick/short name for daily use
  company: varchar('company', { length: 255 }), // Official company name
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  abn: varchar('abn', { length: 20 }), // Australian Business Number
  contactPerson: varchar('contact_person', { length: 255 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Contacts table for client contacts
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  position: varchar('position', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  office: varchar('office', { length: 100 }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active'),
  clientId: integer('client_id').references(() => clients.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Jobs table (replaces production_tasks + project_tasks)
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  unit: varchar('unit', { length: 100 }), // L5, B1, 1003, etc.
  type: varchar('type', { length: 255 }), // B1.28/29, All Units, SPA, etc.
  items: varchar('items', { length: 255 }).notNull(), // Substrates, Kitchen & Butlers, etc.
  nestingDate: varchar('nesting_date', { length: 10 }), // DD/MM/YYYY format
  machiningDate: varchar('machining_date', { length: 10 }), // DD/MM/YYYY format
  assemblyDate: varchar('assembly_date', { length: 10 }), // DD/MM/YYYY format
  deliveryDate: varchar('delivery_date', { length: 10 }), // DD/MM/YYYY format
  statusId: integer('status_id').references(() => jobStatuses.id).notNull(),
  status: jobStatusEnum('status').default('not-assigned'), // Keep for migration
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Pinned projects table
export const pinnedProjects = pgTable('pinned_projects', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id),
  userId: integer('user_id').references(() => users.id),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  token: varchar('token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Holidays table for Gold Coast, Queensland holidays
export const holidays = pgTable('holidays', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  isPublic: boolean('is_public').default(true),
  isCustom: boolean('is_custom').default(false),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Lead times table for managing working days between job statuses
export const leadTimes = pgTable('lead_times', {
  id: serial('id').primaryKey(),
  fromStatusId: integer('from_status_id').notNull().references(() => jobStatuses.id, { onDelete: 'cascade' }),
  toStatusId: integer('to_status_id').notNull().references(() => jobStatuses.id, { onDelete: 'cascade' }),
  days: integer('days').notNull().default(0),
  direction: varchar('direction', { length: 10 }).notNull().default('before'), // 'before' or 'after'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// User column preferences table for customizable table columns
export const userColumnPreferences = pgTable('user_column_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  columnName: varchar('column_name', { length: 100 }).notNull(),
  isVisible: boolean('is_visible').default(true),
  widthPx: integer('width_px'),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type PinnedProject = typeof pinnedProjects.$inferSelect;
export type NewPinnedProject = typeof pinnedProjects.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
export type JobStatus = typeof jobStatuses.$inferSelect;
export type NewJobStatus = typeof jobStatuses.$inferInsert;
export type LeadTime = typeof leadTimes.$inferSelect;
export type NewLeadTime = typeof leadTimes.$inferInsert;
export type UserColumnPreference = typeof userColumnPreferences.$inferSelect;
export type NewUserColumnPreference = typeof userColumnPreferences.$inferInsert;
