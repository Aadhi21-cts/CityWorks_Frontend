import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { AssetService } from '../../services/asset.service';
import { WorkOrderService } from '../../services/work-order.service';
import { ToastService } from '../../services/toast.service';

function extractError(err: any): string {
  const msg = err?.error?.message || err?.error?.error || err?.message;

  if (typeof msg === 'string') {
    return msg;
  }

  if (msg && typeof msg === 'object') {
    const firstValue = Object.values(msg)[0];
    return String(firstValue);
  }

  return 'An unexpected error occurred.';
}

@Component({
  selector: 'app-service-requests',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './service-requests.html',
  styleUrl: './service-requests.css',
})
export class ServiceRequests implements OnInit {
  items: any[] = [];
  loading = true;
  showModal = false;
  form = { assetId: 0, description: '' };
  saving = false;
  formSubmitted = false;
  assets: any[] = [];

  constructor(
    public auth: AuthService,
    private svc: ServiceRequestService,
    private assetSvc: AssetService,
    private workOrderSvc: WorkOrderService,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.load();
    if (this.auth.hasRole('CITIZEN')) {
      this.assetSvc.getAll().subscribe({ next: r => { this.assets = r.data ?? r; }, error: () => {} });
    }
  }

  load() {
    this.loading = true;
    const obs = this.auth.hasRole('CITIZEN')
      ? this.svc.getByCitizen(this.auth.getUserId()!)
      : this.svc.getAll();
    obs.subscribe({
      next: (r) => { this.items = r.data ?? r; this.loading = false; },
      error: (err) => { this.toast.error(extractError(err)); this.loading = false; },
    });
  }

  openModal() { this.form = { assetId: 0, description: '' }; this.formSubmitted = false; this.showModal = true; }
  closeModal() { this.showModal = false; }

  isFormValid(): boolean {
    return this.form.assetId > 0 && this.form.description.trim().length >= 10;
  }

  submit() {
    this.formSubmitted = true;
    if (!this.isFormValid()) { this.toast.warning('Please select an asset and provide a description (min 10 characters).'); return; }
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.closeModal(); this.load(); this.toast.success('Service request submitted successfully.'); },
      error: (err) => { this.saving = false; this.toast.error(extractError(err)); },
    });
  }

  approve(req: any) {
    this.svc.approve(req.requestId).subscribe({
      next: () => {
        this.workOrderSvc.create({ requestId: req.requestId }).subscribe({
          next: () => { this.load(); this.toast.success('Request approved and work order created.'); },
          error: (err) => { this.load(); this.toast.error(extractError(err)); }
        });
      },
      error: (err) => this.toast.error(extractError(err))
    });
  }

  reject(id: number) {
    this.svc.reject(id).subscribe({
      next: () => { this.load(); this.toast.success('Request rejected.'); },
      error: (err) => this.toast.error(extractError(err))
    });
  }

  delete(id: number) {
    if (confirm('Delete this request?')) {
      this.svc.delete(id).subscribe({
        next: () => { this.load(); this.toast.success('Request deleted.'); },
        error: (err) => this.toast.error(extractError(err))
      });
    }
  }

  statusClass(s: string) {
    const m: Record<string, string> = { PENDING:'badge-pending', SUBMITTED:'badge-pending', APPROVED:'badge-approved', REJECTED:'badge-rejected', IN_PROGRESS:'badge-progress', COMPLETED:'badge-completed', CLOSED:'badge-completed' };
    return m[s] ?? 'badge-pending';
  }
}
