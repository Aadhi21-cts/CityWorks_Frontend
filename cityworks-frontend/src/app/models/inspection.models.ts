export interface CreateInspection {
  performedAt: string;
  conditionRating: number;
  findings: string;
  photoUri: string;
  status: string;
  assetId: number;
}

export interface Inspection {
  inspectionId?: number;
  performedAt: string;
  conditionRating: number;
  findings: string;
  photoUri: string;
  status: string;
  assetId: number;
}
