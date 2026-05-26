export interface CreateTask {
  workOrderId: number;
  description: string;
  assignedTo: number;
  dueDate: string;
}

export interface UpdateTask {
  workOrderId?: number;
  description?: string;
  assignedTo?: number;
  dueDate?: string;
  status?: string;
}

export interface Task {
  taskId?: number;
  workOrderId: number;
  description: string;
  assignedTo: number;
  dueDate: string;
  status?: string;
}
