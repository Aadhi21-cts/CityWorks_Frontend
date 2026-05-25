export interface CreateEvidence {
  fileURI: string;
  status: string;
  workOrderId: number;
}

export interface Evidence {
  evidenceId?: number;
  workOrderId: number;
  fileURI: string;
  uploadedAt?: string;
  status: string;
}
