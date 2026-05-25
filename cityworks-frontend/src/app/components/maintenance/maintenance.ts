import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { AssetService } from '../../services/asset.service';

const BASE_AUTH = 'http://localhost:7171/api/auth';

@Component({
  selector: 'app-maintenance',
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.css'
})
export class Maintenance implements OnInit {
  items: any[] = [];
  loading = true; error = '';
  showModal = false; saving = false;
  form = { assetId: 0, taskDescription: '', performedBy: '', performedAt: '', cost: 0, status: 'SCHEDULED' };
  statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED'];
  assets: any[] = [];
  workers: any[] = [];

  // Edit modal
  showEditModal = false; savingEdit = false;
  editForm = { maintainId: 0, assetId: 0, taskDescription: '', performedBy: '', performedAt: '', cost: 0, status: 'SCHEDULED' };

  constructor(
    public auth: AuthService,
    private svc: MaintenanceService,
    private assetSvc: AssetService,
    private http: HttpClient
  ) {}

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
      error: () => { this.error = 'Failed to load maintenance records.'; this.loading = false; }
    });
  }

  assetLabel(id: number): string {
    const a = this.assets.find(x => x.assetId === id);
    return a ? `#${a.assetId} — ${a.name} — ${a.location}` : `#${id}`;
  }

  openModal() {
    this.form = { assetId: 0, taskDescription: '', performedBy: '', performedAt: '', cost: 0, status: 'SCHEDULED' };
    this.showModal = true;
  }

  submit() {
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); },
      error: () => { this.saving = false; }
    });
  }

  openEdit(m: any) {
    this.editForm = { maintainId: m.maintainId, assetId: m.assetId, taskDescription: m.taskDescription, performedBy: m.performedBy, performedAt: m.performedAt, cost: m.cost, status: m.status };
    this.showEditModal = true;
  }

  saveEdit() {
    this.savingEdit = true;
    this.svc.update(this.editForm.maintainId, this.editForm).subscribe({
      next: () => { this.savingEdit = false; this.showEditModal = false; this.load(); },
      error: () => { this.savingEdit = false; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this record?')) this.svc.delete(id).subscribe({ next: () => this.load() });
  }

  statusClass(s: string) {
    const m: Record<string,string> = { SCHEDULED:'badge-pending', IN_PROGRESS:'badge-progress', COMPLETED:'badge-completed', OVERDUE:'badge-rejected', CANCELLED:'badge-rejected' };
    return m[s] ?? 'badge-pending';
  }
}
