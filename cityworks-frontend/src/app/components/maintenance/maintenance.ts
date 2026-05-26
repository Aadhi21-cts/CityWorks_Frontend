import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';

const BASE_AUTH = 'http://localhost:7171/api/auth';

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
  selector: 'app-maintenance',
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.css'
})
export class Maintenance implements OnInit {
  items: any[] = [];
  loading = true; error = '';
  showModal = false; saving = false; formSubmitted = false;
  form = { assetId: 0, taskDescription: '', performedBy: '', performedAt: '', cost: 0, status: 'SCHEDULED' };
  statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'];
  assets: any[] = []; workers: any[] = [];
  showEditModal = false; savingEdit = false;
  editForm = { maintainId: 0, assetId: 0, taskDescription: '', performedBy: '', performedAt: '', cost: 0, status: 'SCHEDULED' };

  constructor(public auth: AuthService, private svc: MaintenanceService, private assetSvc: AssetService, private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.load();
    this.assetSvc.getAll().subscribe({ next: r => { this.assets = r.data ?? r; }, error: () => {} });
    if (this.auth.hasRole('SUPERVISOR')) {
      this.http.get<any>(`${BASE_AUTH}/users/workers/active`).subscribe({ next: r => { this.workers = r.data ?? r; }, error: () => {} });
    }
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data ?? r; this.loading = false; },
      error: err => { this.toast.error(extractError(err)); this.loading = false; }
    });
  }

  assetLabel(id: number): string {
    const a = this.assets.find(x => x.assetId === id);
    return a ? `#${a.assetId} — ${a.name} — ${a.location}` : `#${id}`;
  }

  openModal() {
    this.form = { assetId: 0, taskDescription: '', performedBy: '', performedAt: '', cost: 0, status: 'SCHEDULED' };
    this.formSubmitted = false; this.showModal = true;
  }

  isFormValid(): boolean {
    return this.form.assetId > 0 && !!this.form.taskDescription.trim() && !!this.form.performedBy && !!this.form.performedAt && this.form.cost >= 0;
  }

  submit() {
    this.formSubmitted = true;
    if (!this.isFormValid()) { this.toast.warning('Please fill in all required fields.'); return; }
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); this.toast.success('Maintenance record created successfully.'); },
      error: err => { this.saving = false; this.toast.error(extractError(err)); }
    });
  }

  openEdit(m: any) {
    this.editForm = { maintainId: m.maintainId, assetId: m.assetId, taskDescription: m.taskDescription, performedBy: m.performedBy, performedAt: m.performedAt, cost: m.cost, status: m.status };
    this.showEditModal = true;
  }

  saveEdit() {
    if (!this.editForm.taskDescription.trim() || !this.editForm.performedBy || !this.editForm.performedAt) {
      this.toast.warning('Please fill in all required fields.'); return;
    }
    this.savingEdit = true;
    this.svc.update(this.editForm.maintainId, this.editForm).subscribe({
      next: () => { this.savingEdit = false; this.showEditModal = false; this.load(); this.toast.success('Maintenance record updated successfully.'); },
      error: err => { this.savingEdit = false; this.toast.error(extractError(err)); }
    });
  }

  delete(id: number) {
    if (confirm('Delete this record?')) {
      this.svc.delete(id).subscribe({
        next: () => { this.load(); this.toast.success('Maintenance record deleted.'); },
        error: err => this.toast.error(extractError(err))
      });
    }
  }

  statusClass(s: string) {
    const m: Record<string,string> = { SCHEDULED:'badge-pending', IN_PROGRESS:'badge-progress', COMPLETED:'badge-completed', OVERDUE:'badge-rejected', CANCELLED:'badge-rejected' };
    return m[s] ?? 'badge-pending';
  }
}
