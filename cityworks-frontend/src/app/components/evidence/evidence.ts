import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { EvidenceService } from '../../services/evidence.service';
import { TaskService } from '../../services/task.service';
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
  selector: 'app-evidence',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './evidence.html',
  styleUrl: './evidence.css',
})
export class Evidence implements OnInit {
  loading = true;
  allItems: any[] = [];
  totalEvidence = 0;
  pendingUploads = 0;
  myTasks: any[] = [];
  showUploadModal = false;
  saving = false;
  uploadFormSubmitted = false;
  uploadForm = { taskId: 0, file: null as File | null };
  selectedFileName = '';

  supervisorWorkOrders: any[] = [];
  expandedOrderId: number | null = null;
  orderTasks: Record<number, any[]> = {};
  orderEvidence: Record<number, any[]> = {};
  loadingOrderDetail: Record<number, boolean> = {};
  showPreviewModal = false;
  previewEvidence: any = null;
  previewLocalUrl: string | null = null;
  changingEvidenceId: number | null = null;
  evidenceStatusForm: Record<number, string> = {};
  auditItems: any[] = [];

  constructor(
    public auth: AuthService,
    private svc: EvidenceService,
    private taskSvc: TaskService,
    private workOrderSvc: WorkOrderService,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    if (this.auth.hasRole('WORKER')) this.loadWorkerEvidence();
    else if (this.auth.hasRole('SUPERVISOR')) this.loadSupervisorView();
    else this.loadAll();
  }

  loadWorkerEvidence() {
    this.loading = true;
    const wid = this.auth.getUserId()!;
    this.svc.getAll().subscribe({
      next: (r) => {
        this.allItems = r.data ?? r;
        this.loading = false;
        this.computeWorkerStats();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(extractError(err));
      },
    });
    this.taskSvc.getAll().subscribe({
      next: (r) => {
        this.myTasks = (r.data ?? r).filter((t: any) => t.assignedTo === wid);
        this.computeWorkerStats();
      },
      error: () => {},
    });
  }

  computeWorkerStats() {
    const myTaskIds = this.myTasks.map((t) => t.taskId);
    const myEvidence = this.allItems.filter((e) => myTaskIds.includes(e.taskId));
    this.totalEvidence = myEvidence.length;
    this.pendingUploads = this.myTasks.filter(
      (t) => !myEvidence.find((e) => e.taskId === t.taskId),
    ).length;
  }

  get myEvidenceItems(): any[] {
    const myTaskIds = this.myTasks.map((t) => t.taskId);
    return this.allItems.filter((e) => myTaskIds.includes(e.taskId));
  }

  openUploadModal() {
    this.uploadForm = { taskId: 0, file: null };
    this.selectedFileName = '';
    this.uploadFormSubmitted = false;
    this.showUploadModal = true;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadForm.file = input.files[0];
      this.selectedFileName = input.files[0].name;
    }
  }

  submitUpload() {
    this.uploadFormSubmitted = true;
    if (!this.uploadForm.taskId) {
      this.toast.warning('Please select a task.');
      return;
    }
    if (!this.uploadForm.file) {
      this.toast.warning('Please select a file to upload.');
      return;
    }
    this.saving = true;
    const localUrl = URL.createObjectURL(this.uploadForm.file);
    
    const task = this.myTasks.find((t) => t.taskId === +this.uploadForm.taskId);
    this.svc
      .create({ taskId: this.uploadForm.taskId, fileURI: localUrl, status: 'UPLOADED', workOrderId: task.workOrderId})
      .subscribe({
        next: () => {
          this.saving = false;
          this.showUploadModal = false;
          this.loadWorkerEvidence();
          this.toast.success('Evidence uploaded successfully.');
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(extractError(err));
        },
      });
  }

  taskDesc(taskId: number): string {
    const t = this.myTasks.find((x) => x.taskId === taskId);
    return t ? `Task #${t.taskId} — ${t.description}` : `#${taskId}`;
  }

  loadSupervisorView() {
    this.loading = true;
    this.workOrderSvc.getAll().subscribe({
      next: (r) => {
        const all = r.data ?? r;
        this.supervisorWorkOrders = all.filter((w: any) =>
          ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(w.status),
        );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(extractError(err));
      },
    });
  }

  toggleOrderDetail(orderId: number) {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
      return;
    }
    this.expandedOrderId = orderId;
    if (!this.orderTasks[orderId]) this.loadOrderDetail(orderId);
  }

  loadOrderDetail(orderId: number) {
    this.loadingOrderDetail[orderId] = true;
    this.taskSvc.getAll().subscribe({
      next: (r) => {
        const tasks = (r.data ?? r).filter((t: any) => t.workOrderId === orderId);
        this.orderTasks[orderId] = tasks;
        this.svc.getAll().subscribe({
          next: (er) => {
            const allEvidence = er.data ?? er;
            const taskIds = tasks.map((t: any) => t.taskId);
            this.orderEvidence[orderId] = allEvidence.filter((e: any) =>
              taskIds.includes(e.taskId),
            );
            this.loadingOrderDetail[orderId] = false;
          },
          error: (err) => {
            this.loadingOrderDetail[orderId] = false;
            this.toast.error(extractError(err));
          },
        });
      },
      error: (err) => {
        this.loadingOrderDetail[orderId] = false;
        this.toast.error(extractError(err));
      },
    });
  }

  getEvidenceForTask(orderId: number, taskId: number): any[] {
    return (this.orderEvidence[orderId] ?? []).filter((e) => e.taskId === taskId);
  }

  openPreview(ev: any) {
    this.previewEvidence = ev;
    this.previewLocalUrl = ev.fileURI;
    this.showPreviewModal = true;
  }
  closePreview() {
    this.showPreviewModal = false;
    this.previewEvidence = null;
    this.previewLocalUrl = null;
  }

  changeEvidenceStatus(ev: any, orderId: number) {
    const newStatus = this.evidenceStatusForm[ev.evidenceId];
    if (!newStatus) {
      this.toast.warning('Please select a status.');
      return;
    }
    this.changingEvidenceId = ev.evidenceId;
    this.svc.update(ev.evidenceId, newStatus).subscribe({
      next: () => {
        if (newStatus === 'VERIFIED') {
          const task = (this.orderTasks[orderId] ?? []).find((t: any) =>
            (this.orderEvidence[orderId] ?? []).some(
              (e) => e.evidenceId === ev.evidenceId && e.taskId === t.taskId,
            ),
          );
          if (task)
            this.taskSvc
              .update(task.taskId, { status: 'COMPLETED' })
              .subscribe({ next: () => {}, error: () => {} });
        }
        this.changingEvidenceId = null;
        this.loadOrderDetail(orderId);
        this.toast.success(`Evidence status updated to ${newStatus}.`);
      },
      error: (err) => {
        this.changingEvidenceId = null;
        this.toast.error(extractError(err));
      },
    });
  }

  loadAll() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (r) => {
        this.auditItems = r.data ?? r;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(extractError(err));
      },
    });
  }

  delete(id: number) {
    if (confirm('Delete this evidence?')) {
      this.svc.delete(id).subscribe({
        next: () => {
          this.loadAll();
          this.toast.success('Evidence deleted.');
        },
        error: (err) => this.toast.error(extractError(err)),
      });
    }
  }

  statusClass(s: string) {
    const m: Record<string, string> = {
      UPLOADED: 'badge-pending',
      VERIFIED: 'badge-approved',
      REJECTED: 'badge-rejected',
      COMPLETED: 'badge-completed',
    };
    return m[s] ?? 'badge-pending';
  }

  woStatusClass(s: string) {
    const m: Record<string, string> = {
      ASSIGNED: 'badge-assigned',
      IN_PROGRESS: 'badge-progress',
      ON_HOLD: 'badge-pending',
      COMPLETED: 'badge-completed',
    };
    return m[s] ?? 'badge-pending';
  }
}
