export interface CreateAsset {
  name: string;
  type: string;
  location: string;
  condition: string;
  status: string;
  installedAt: string;
}

export interface Asset {
  assetId?: number;
  name: string;
  type: string;
  location: string;
  condition: string;
  status: string;
  installedAt: string;
}
