import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AssetService } from '../../services/asset.service';
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
  selector: 'app-assets',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './assets.html',
  styleUrl: './assets.css'
})
export class Assets implements OnInit {
  items: any[] = [];
  loading = true;
  showModal = false; saving = false;
  form = { name: '', type: 'ROAD', location: '', condition: 'GOOD', status: 'ACTIVE', installedAt: '' };
  formSubmitted = false;

  showEditModal = false; savingEdit = false;
  editForm = { assetId: 0, condition: '', status: '' };

  assetTypes = ['ROAD', 'LIGHT', 'BIN'];
  conditions = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];
  statuses   = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'];

  constructor(public auth: AuthService, private svc: AssetService, private toast: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data ?? r; this.loading = false; },
      error: err => { this.toast.error(extractError(err)); this.loading = false; }
    });
  }

  openModal() {
    this.form = { name: '', type: 'ROAD', location: '', condition: 'GOOD', status: 'ACTIVE', installedAt: '' };
    this.formSubmitted = false;
    this.showModal = true;
  }

  isFormValid(): boolean {
    return !!(this.form.name.trim() && this.form.location.trim() && this.form.installedAt);
  }

  submit() {
    this.formSubmitted = true;
    if (!this.isFormValid()) { this.toast.warning('Please fill in all required fields.'); return; }
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); this.toast.success('Asset created successfully.'); },
      error: err => { this.saving = false; this.toast.error(extractError(err)); }
    });
  }

  openEdit(a: any) {
    this.editForm = { assetId: a.assetId, condition: a.condition, status: a.status };
    this.showEditModal = true;
  }

  saveEdit() {
    this.savingEdit = true;
    this.svc.update(this.editForm.assetId, { condition: this.editForm.condition, status: this.editForm.status }).subscribe({
      next: () => { this.savingEdit = false; this.showEditModal = false; this.load(); this.toast.success('Asset updated successfully.'); },
      error: err => { this.savingEdit = false; this.toast.error(extractError(err)); }
    });
  }

  delete(id: number) {
    if (confirm('Delete this asset?')) {
      this.svc.delete(id).subscribe({
        next: () => { this.load(); this.toast.success('Asset deleted.'); },
        error: err => this.toast.error(extractError(err))
      });
    }
  }

  conditionClass(c: string) {
    const m: Record<string,string> = { EXCELLENT:'badge-approved', GOOD:'badge-approved', FAIR:'badge-pending', POOR:'badge-progress', DAMAGED:'badge-rejected' };
    return m[c] ?? 'badge-pending';
  }
}
