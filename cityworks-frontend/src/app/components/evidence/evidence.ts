import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { EvidenceService } from '../../services/evidence.service';
import { TaskService } from '../../services/task.service';
import { WorkOrderService } from '../../services/work-order.service';

const BASE_AUTH = 'http://localhost:7171/api/auth';

@Component({
  selector: 'app-evidence',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './evidence.html',
  styleUrl: './evidence.css',
})
export class Evidence implements OnInit {
  loading = true;
  error = '';

  // WORKER
  allItems: any[] = [];
  totalEvidence = 0;
  pendingUploads = 0;
  myTasks: any[] = []; // tasks assigned to worker for upload dropdown
  showUploadModal = false;
  saving = false;
  uploadForm = { taskId: 0, file: null as File | null };
  selectedFileName = '';

  // SUPERVISOR - grouped by work order (ASSIGNED, IN_PROGRESS, ON_HOLD)
  supervisorWorkOrders: any[] = [];
  expandedOrderId: number | null = null;
  orderTasks: Record<number, any[]> = {}; // tasks per work order
  orderEvidence: Record<number, any[]> = {}; // evidence per work order (by task)
  loadingOrderDetail: Record<number, boolean> = {};
  // evidence preview popup
  showPreviewModal = false;
  previewEvidence: any = null;
  previewLocalUrl: string | null = null;
  // status change
  changingEvidenceId: number | null = null;
  evidenceStatusForm: Record<number, string> = {};

  // AUDITOR
  auditItems: any[] = [];

  constructor(
    public auth: AuthService,
    private svc: EvidenceService,
    private taskSvc: TaskService,
    private workOrderSvc: WorkOrderService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    if (this.auth.hasRole('WORKER')) this.loadWorkerEvidence();
    else if (this.auth.hasRole('SUPERVISOR')) this.loadSupervisorView();
    else {
      this.loadAll();
    }
  }

  // ── WORKER ──────────────────────────────────────────────
  loadWorkerEvidence() {
    this.loading = true;
    const wid = this.auth.getUserId()!;
    this.svc.getAll().subscribe({
      next: (r) => {
        const all = r.data ?? r;
        // Filter evidences linked to tasks assigned to this worker
        this.allItems = all;
        this.loading = false;
        this.computeWorkerStats();
      },
      error: () => {
        this.loading = false;
      },
    });
    // Load only tasks assigned to this worker for the upload dropdown
    this.taskSvc.getAll().subscribe({
      next: (r) => {
        this.myTasks = (r.data ?? r).filter((t: any) => t.assignedTo === wid);
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
    if (!this.uploadForm.file || !this.uploadForm.taskId) return;
    this.saving = true;
    // Store file locally (in-browser object URL as fileURI), status = UPLOADED
    const localUrl = URL.createObjectURL(this.uploadForm.file);
    const body = { taskId: this.uploadForm.taskId, fileURI: localUrl, status: 'UPLOADED' };
    this.svc.create(body).subscribe({
      next: () => {
        this.saving = false;
        this.showUploadModal = false;
        this.loadWorkerEvidence();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  taskDesc(taskId: number): string {
    const t = this.myTasks.find((x) => x.taskId === taskId);
    return t ? `Task #${t.taskId} — ${t.description}` : `#${taskId}`;
  }

  // ── SUPERVISOR ──────────────────────────────────────────
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
      error: () => {
        this.loading = false;
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
    // Load all tasks, filter by workOrderId
    this.taskSvc.getAll().subscribe({
      next: (r) => {
        const tasks = (r.data ?? r).filter((t: any) => t.workOrderId === orderId);
        this.orderTasks[orderId] = tasks;
        // Load evidence for each task
        this.svc.getByWorkOrderId(orderId).subscribe({
          next: (er) => {
            const allEvidence = er.data ?? er;
            const taskIds = tasks.map((t: any) => t.taskId);
            this.orderEvidence[orderId] = allEvidence.filter((e: any) =>
              taskIds.includes(e.taskId),
            );
            this.loadingOrderDetail[orderId] = false;
          },
          error: (error) => {
            console.log(error);
            this.loadingOrderDetail[orderId] = false;
          },
        });
      },
      error: (error) => {
        console.log(error);
        this.loadingOrderDetail[orderId] = false;
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
    if (!newStatus) return;
    this.changingEvidenceId = ev.evidenceId;
    this.svc.update(ev.evidenceId, newStatus).subscribe({
      next: () => {
        // If VERIFIED, also mark the task COMPLETED
        if (newStatus === 'VERIFIED') {
          const task = (this.orderTasks[orderId] ?? []).find((t: any) =>
            (this.orderEvidence[orderId] ?? []).some(
              (e) => e.evidenceId === ev.evidenceId && e.taskId === t.taskId,
            ),
          );
          if (task) {
            this.taskSvc
              .update(task.taskId, { status: 'COMPLETED' })
              .subscribe({ next: () => {}, error: () => {} });
          }
        }
        this.changingEvidenceId = null;
        this.loadOrderDetail(orderId);
      },
      error: () => {
        this.changingEvidenceId = null;
      },
    });
  }

  // ── FALLBACK (ADMIN/AUDITOR) ─────────────────────────────
  loadAll() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (r) => {
        this.auditItems = r.data ?? r;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  delete(id: number) {
    if (confirm('Delete this evidence?'))
      this.svc.delete(id).subscribe({ next: () => this.loadAll() });
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
    };
    return m[s] ?? 'badge-pending';
  }
}
