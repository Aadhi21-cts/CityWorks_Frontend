import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { WorkOrderService } from '../../services/work-order.service';
import { ToastService } from '../../services/toast.service';

const BASE = 'http://localhost:7171/api/auth';

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
  selector: 'app-tasks',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  items: any[] = [];
  loading = true; error = '';
  showModal = false; showStatusModal = false;
  form = { workOrderId: 0, description: '', assignedTo: 0, dueDate: '' };
  statusForm = { taskId: 0, status: 'IN_PROGRESS' };
  saving = false; formSubmitted = false;
  statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED'];
  workers: any[] = [];
  workOrders: any[] = [];
  expandedWorkOrderId: number | null = null;
  tasksByWorkOrder: Record<number, any[]> = {};

  constructor(
    public auth: AuthService,
    private svc: TaskService,
    private workOrderSvc: WorkOrderService,
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.load();
    if (this.auth.hasRole('SUPERVISOR')) { this.loadWorkers(); this.loadWorkOrders(); }
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (r) => {
        let all = r.data ?? r;
        if (this.auth.hasRole('WORKER')) all = all.filter((t: any) => t.assignedTo === this.auth.getUserId());
        this.items = all; this.loading = false;
      },
      error: (err) => { this.toast.error(extractError(err)); this.loading = false; },
    });
  }

  loadWorkers() {
    this.http.get<any>(`${BASE}/users/workers/active`).subscribe({
      next: (r) => { this.workers = r.data ?? r; },
      error: (err) => { this.toast.error(extractError(err)); },
    });
  }

  loadWorkOrders() {
    this.workOrderSvc.getAll().subscribe({
      next: (r) => { this.workOrders = (r.data ?? r).filter((w: any) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED'); },
      error: () => {},
    });
  }

  openModal() { this.form = { workOrderId: 0, description: '', assignedTo: 0, dueDate: '' }; this.formSubmitted = false; this.showModal = true; }
  openStatus(item: any) { this.statusForm = { taskId: item.taskId, status: item.status }; this.showStatusModal = true; }

  isFormValid(): boolean {
    return this.form.workOrderId > 0 && this.form.description.trim().length >= 5 && this.form.assignedTo > 0 && !!this.form.dueDate;
  }

  submit() {
    this.formSubmitted = true;
    if (!this.isFormValid()) { this.toast.warning('Please fill in all required fields.'); return; }
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); this.toast.success('Task created successfully.'); },
      error: (err) => { this.saving = false; this.toast.error(extractError(err)); },
    });
  }

  updateStatus() {
    this.saving = true;
    this.svc.update(this.statusForm.taskId, { status: this.statusForm.status }).subscribe({
      next: () => { this.saving = false; this.showStatusModal = false; this.load(); this.toast.success('Task status updated.'); },
      error: (err) => { this.saving = false; this.toast.error(extractError(err)); },
    });
  }

  delete(id: number) {
    if (confirm('Delete this task?')) {
      this.svc.delete(id).subscribe({
        next: () => { this.load(); this.toast.success('Task deleted.'); },
        error: (err) => this.toast.error(extractError(err))
      });
    }
  }

  workerName(id: number): string {
    const w = this.workers.find(x => x.userId === id);
    return w ? `${w.name} (#${w.userId})` : `#${id}`;
  }

  toggleWorkOrderTasks(workOrderId: number) {
    if (this.expandedWorkOrderId === workOrderId) { this.expandedWorkOrderId = null; return; }
    this.expandedWorkOrderId = workOrderId;
    this.tasksByWorkOrder[workOrderId] = this.items.filter(t => t.workOrderId === workOrderId);
  }

  get uniqueWorkOrderIds(): number[] {
    return [...new Set(this.items.map(t => t.workOrderId))];
  }

  statusClass(s: string) {
    const m: Record<string, string> = { PENDING:'badge-pending', IN_PROGRESS:'badge-progress', COMPLETED:'badge-completed', BLOCKED:'badge-rejected', CANCELLED:'badge-rejected' };
    return m[s] ?? 'badge-pending';
  }
}
