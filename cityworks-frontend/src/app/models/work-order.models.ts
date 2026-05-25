export interface CreateWorkOrderRequest {
  requestId: number;
}

export interface WorkOrder {
  workOrderId?: number;
  requestId: number;
  assetId?: number;
  assignedWorkerId?: number;
  assignedAt?: string;
  completedAt?: string;
  status?: string;
}

export interface AssignWorkerRequest {
  orderId: number;
  workerId: number;
}
