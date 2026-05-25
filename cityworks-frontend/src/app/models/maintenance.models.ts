export interface CreateMaintenance {
  taskDescription: string;
  performedBy: string;
  performedAt: string;
  cost: number;
  status: string;
  assetId: number;
}

export interface Maintenance {
  maintainId?: number;
  taskDescription: string;
  performedBy: string;
  performedAt: string;
  cost: number;
  status: string;
  assetId: number;
}
