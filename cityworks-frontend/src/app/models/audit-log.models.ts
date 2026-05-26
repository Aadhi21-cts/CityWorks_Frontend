export interface CreateAuditLog {
  action: string;
  resourceType: string;
  details: string;
  serviceName: string;
}

export interface AuditLog {
  auditId?: number;
  action: string;
  resourceType: string;
  details: string;
  serviceName: string;
  timestamp?: string;
}
