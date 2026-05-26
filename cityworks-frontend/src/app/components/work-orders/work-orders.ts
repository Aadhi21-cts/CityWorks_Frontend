import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { WorkOrderService } from '../../services/work-order.service';
import { EvidenceService } from '../../services/evidence.service';
import { ToastService } from '../../services/toast.service';

const BASE = 'http://localhost:7171/api';

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
  selector: 'app-work-orders',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.css',
})
export class WorkOrders implements OnInit {
  items: any[] = [];
  loading = true;
  saving = false;

  showAssignModal = false;
  assignForm = { orderId: 0, workerId: 0, status: 'ASSIGNED' };
  workers: any[] = [];
  assignStatuses = ['ASSIGNED', 'IN_PROGRESS'];

  showEditWorkerModal = false;
  editWorkerForm = { orderId: 0, workerId: 0 };

  expandedEvidenceOrderId: number | null = null;
  evidenceByOrder: Record<number, any[]> = {};
  evidenceLoading = false;

  showInlineStatusForm: Record<number, boolean> = {};
  inlineStatusForm: Record<number, string> = {};

  constructor(
    public auth: AuthService,
    private svc: WorkOrderService,
    private evidenceSvc: EvidenceService,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.load();
    if (this.auth.hasRole('SUPERVISOR', 'ADMIN')) this.loadWorkers();
  }

  load() {
    this.loading = true;
    const obs = this.auth.hasRole('WORKER')
      ? this.svc.getByWorker(this.auth.getUserId()!)
      : this.svc.getAll();
    obs.subscribe({
      next: (r) => {
        this.items = r.data ?? r;
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(extractError(err));
        this.loading = false;
      },
    });
  }

  loadWorkers() {
    this.http.get<any>(`${BASE}/auth/users/workers/active`).subscribe({
      next: (r) => {
        this.workers = r.data ?? r;
      },
      error: (err) => {
        this.toast.error(extractError(err));
      },
    });
  }

  openAssign(item: any) {
    this.assignForm = { orderId: item.workOrderId, workerId: 0, status: 'ASSIGNED' };
    this.showAssignModal = true;
  }

  assign() {
    if (!this.assignForm.workerId) {
      this.toast.warning('Please select a worker.');
      return;
    }
    this.saving = true;
    this.svc
      .assignWorker({ orderId: this.assignForm.orderId, workerId: this.assignForm.workerId })
      .subscribe({
        next: () => {
          this.svc.updateStatus(this.assignForm.orderId, this.assignForm.status).subscribe({
            next: () => {
              this.saving = false;
              this.showAssignModal = false;
              this.load();
              this.toast.success('Worker assigned successfully.');
            },
            error: (err) => {
              this.saving = false;
              this.showAssignModal = false;
              this.load();
              this.toast.error(extractError(err));
            },
          });
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(extractError(err));
        },
      });
  }

  openEditWorker(item: any) {
    this.editWorkerForm = { orderId: item.workOrderId, workerId: item.assignedWorkerId ?? 0 };
    this.showEditWorkerModal = true;
  }

  editWorker() {
    if (!this.editWorkerForm.workerId) {
      this.toast.warning('Please select a worker.');
      return;
    }
    this.saving = true;
    this.svc
      .assignWorker({
        orderId: this.editWorkerForm.orderId,
        workerId: this.editWorkerForm.workerId,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.showEditWorkerModal = false;
          this.load();
          this.toast.success('Worker updated successfully.');
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(extractError(err));
        },
      });
  }

  toggleInlineStatus(item: any) {
    const id = item.workOrderId;
    if (this.showInlineStatusForm[id]) {
      this.showInlineStatusForm[id] = false;
      return;
    }
    this.showInlineStatusForm[id] = true;
    this.inlineStatusForm[id] = item.status;
    this.loadEvidenceForOrder(id);
  }

  loadEvidenceForOrder(orderId: number) {
    this.evidenceLoading = true;
    this.evidenceSvc.getByWorkOrderId(orderId).subscribe({
      next: (r) => {
        this.evidenceByOrder[orderId] = r.data ?? r;
        this.evidenceLoading = false;
      },
      error: (err) => {
        this.evidenceLoading = false;
        this.toast.error(extractError(err));
      },
    });
  }

  canCompleteOrder(orderId: number): boolean {
    const ev = this.evidenceByOrder[orderId] ?? [];
    if (ev.length === 0) return false;
    return ev.every((e: any) => e.status === 'VERIFIED' || e.status === 'APPROVED');
  }

  updateInlineStatus(item: any) {
    const id = item.workOrderId;
    const newStatus = this.inlineStatusForm[id];
    if (newStatus === 'COMPLETED' && !this.canCompleteOrder(id)) {
      this.toast.warning(
        'All completion evidence must be VERIFIED before marking this work order as Completed.',
      );
      return;
    }
    this.saving = true;
    this.svc.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.saving = false;
        this.showInlineStatusForm[id] = false;
        this.load();
        this.toast.success('Status updated successfully.');
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(extractError(err));
      },
    });
  }

  toggleEvidence(orderId: number) {
    if (this.expandedEvidenceOrderId === orderId) {
      this.expandedEvidenceOrderId = null;
      return;
    }
    this.expandedEvidenceOrderId = orderId;
    this.loadEvidenceForOrder(orderId);
  }

  workerName(id: number): string {
    const w = this.workers.find((x) => x.userId === id);
    return w ? `${w.name} (#${w.userId})` : `#${id}`;
  }

  statusClass(s: string) {
    const m: Record<string, string> = {
      OPEN: 'badge-open',
      NEW: 'badge-pending',
      CREATED: 'badge-pending',
      IN_PROGRESS: 'badge-progress',
      COMPLETED: 'badge-completed',
      ASSIGNED: 'badge-assigned',
      ON_HOLD: 'badge-pending',
      CANCELLED: 'badge-rejected',
    };
    return m[s] ?? 'badge-open';
  }
}
