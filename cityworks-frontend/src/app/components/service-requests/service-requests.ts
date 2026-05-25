import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { AssetService } from '../../services/asset.service';
import { WorkOrderService } from '../../services/work-order.service';

const BASE = 'http://localhost:7171/api';

@Component({
  selector: 'app-service-requests',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './service-requests.html',
  styleUrl: './service-requests.css',
})
export class ServiceRequests implements OnInit {
  items: any[] = [];
  loading = true;
  error = '';
  showModal = false;
  form = { assetId: 0, description: '' };
  saving = false;
  assets: any[] = [];

  constructor(
    public auth: AuthService,
    private svc: ServiceRequestService,
    private assetSvc: AssetService,
    private workOrderSvc: WorkOrderService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.load();
    if (this.auth.hasRole('CITIZEN')) {
      this.assetSvc.getAll().subscribe({
        next: r => { this.assets = r.data ?? r; },
        error: () => {}
      });
    }
  }

  load() {
    this.loading = true;
    if (this.auth.hasRole('CITIZEN')) {
      this.svc.getByCitizen(this.auth.getUserId()!).subscribe({
        next: (r) => { this.items = r.data ?? r; this.loading = false; },
        error: () => { this.error = 'Failed to load requests.'; this.loading = false; },
      });
    } else if (this.auth.hasRole('SUPERVISOR', 'ADMIN')) {
      this.svc.getAll().subscribe({
        next: (r) => { this.items = r.data ?? r; this.loading = false; },
        error: () => { this.error = 'Failed to load requests.'; this.loading = false; },
      });
    } else {
      this.loading = false;
    }
  }

  openModal() {
    this.form = { assetId: 0, description: '' };
    this.showModal = true;
  }
  closeModal() { this.showModal = false; }

  submit() {
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); },
      error: () => { this.saving = false; },
    });
  }

  // Approve and auto-create work order
  approve(req: any) {
    this.svc.approve(req.requestId).subscribe({
      next: () => {
        // Auto-create work order with requestId, no assigned worker
        this.workOrderSvc.create({ requestId: req.requestId }).subscribe({
          next: () => { this.load(); },
          error: () => { this.load(); }
        });
      }
    });
  }

  reject(id: number) {
    this.svc.reject(id).subscribe({ next: () => this.load() });
  }
  delete(id: number) {
    if (confirm('Delete this request?')) this.svc.delete(id).subscribe({ next: () => this.load() });
  }

  statusClass(s: string) {
    const m: Record<string, string> = {
      PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected',
      IN_PROGRESS: 'badge-progress', COMPLETED: 'badge-completed',
    };
    return m[s] ?? 'badge-pending';
  }
}
