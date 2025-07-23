// TypeScript types for the application
export interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export interface ProductionTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: User;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = ProductionTask['status'];
export type TaskPriority = ProductionTask['priority'];
