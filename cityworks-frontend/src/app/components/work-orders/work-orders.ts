import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { WorkOrderService } from '../../services/work-order.service';
import { EvidenceService } from '../../services/evidence.service';

const BASE = 'http://localhost:7171/api';

@Component({
  selector: 'app-work-orders',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.css',
})
export class WorkOrders implements OnInit {
  items: any[] = [];
  loading = true;
  error = '';
  saving = false;

  // Assign worker modal (for NEW status)
  showAssignModal = false;
  assignForm = { orderId: 0, workerId: 0, status: 'IN_PROGRESS' };
  workers: any[] = [];
  assignStatuses = ['IN_PROGRESS', 'COMPLETED'];

  // Edit worker modal (change assigned worker)
  showEditWorkerModal = false;
  editWorkerForm = { orderId: 0, workerId: 0 };

  // Expanded completion evidence per work order
  expandedEvidenceOrderId: number | null = null;
  evidenceByOrder: Record<number, any[]> = {};
  evidenceLoading = false;

  // Status dropdown inline (for IN_PROGRESS)
  showInlineStatusForm: Record<number, boolean> = {};
  inlineStatusForm: Record<number, string> = {};

  constructor(
    public auth: AuthService,
    private svc: WorkOrderService,
    private evidenceSvc: EvidenceService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.load();
    if (this.auth.hasRole('SUPERVISOR', 'ADMIN')) {
      this.loadWorkers();
    }
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
      error: () => {
        this.error = 'Failed to load work orders.';
        this.loading = false;
      },
    });
  }

  loadWorkers() {
    this.http.get<any>(`${BASE}/auth/users/workers/active`).subscribe({
      next: (r) => {
        this.workers = r.data ?? r;
      },
      error: () => {},
    });
  }

  // Open assign modal for NEW work orders
  openAssign(item: any) {
    this.assignForm = { orderId: item.workOrderId, workerId: item.workerId, status: 'IN_PROGRESS' };
    this.showAssignModal = true;
  }

  assign() {
    this.saving = true;
    console.log('Assigning worker', this.assignForm.orderId, this.assignForm.workerId);
    this.svc
      .assignWorker({ orderId: this.assignForm.orderId, workerId: this.assignForm.workerId })
      .subscribe({
        next: () => {
          // Also update status
          this.svc.updateStatus(this.assignForm.orderId, this.assignForm.status).subscribe({
            next: () => {
              this.saving = false;
              this.showAssignModal = false;
              this.load();
            },
            error: () => {
              console.log(this.error);
              this.saving = false;
              this.showAssignModal = false;
              this.load();
            },
          });
        },
        error: () => {
          console.log(this.error);
          this.saving = false;
        },
      });
  }

  // Open edit worker modal
  openEditWorker(item: any) {
    this.editWorkerForm = { orderId: item.workOrderId, workerId: item.assignedWorkerId ?? 0 };
    this.showEditWorkerModal = true;
  }

  editWorker() {
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
        },
        error: () => {
          this.saving = false;
        },
      });
  }

  // Toggle inline status panel for IN_PROGRESS orders
  toggleInlineStatus(item: any) {
    const id = item.workOrderId;
    if (this.showInlineStatusForm[id]) {
      this.showInlineStatusForm[id] = false;
    } else {
      this.showInlineStatusForm[id] = true;
      this.inlineStatusForm[id] = item.status;
      // Load evidence for this order
      this.loadEvidenceForOrder(id);
    }
  }

  loadEvidenceForOrder(orderId: number) {
    this.evidenceLoading = true;
    this.evidenceSvc.getByWorkOrderId(orderId).subscribe({
      next: (r) => {
        const all = r.data ?? r;
        this.evidenceByOrder[orderId] = all;
        this.evidenceLoading = false;
      },
      error: () => {
        this.evidenceLoading = false;
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
      alert(
        'All completion evidence for this work order must be COMPLETED before marking it as Completed.',
      );
      return;
    }
    this.saving = true;
    this.svc.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.saving = false;
        this.showInlineStatusForm[id] = false;
        this.load();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  // Toggle evidence expansion (non-popup, inline)
  toggleEvidence(orderId: number) {
    if (this.expandedEvidenceOrderId === orderId) {
      this.expandedEvidenceOrderId = null;
    } else {
      this.expandedEvidenceOrderId = orderId;
      this.loadEvidenceForOrder(orderId);
    }
  }

  workerName(id: number): string {
    const w = this.workers.find((x) => x.userId === id);
    return w ? `${w.name} (#${w.userId})` : `#${id}`;
  }

  statusClass(s: string) {
    const m: Record<string, string> = {
      OPEN: 'badge-open',
      NEW: 'badge-pending',
      IN_PROGRESS: 'badge-progress',
      COMPLETED: 'badge-completed',
      ASSIGNED: 'badge-assigned',
    };
    return m[s] ?? 'badge-open';
  }
}
