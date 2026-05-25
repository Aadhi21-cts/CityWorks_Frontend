import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-assets',
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './assets.html',
  styleUrl: './assets.css'
})
export class Assets implements OnInit {
  items: any[] = [];
  loading = true; error = '';
  showModal = false; saving = false;
  form = { name: '', type: 'ROAD', location: '', condition: 'GOOD', status: 'ACTIVE', installedAt: '' };

  // Edit modal - only status and condition
  showEditModal = false; savingEdit = false;
  editForm = { assetId: 0, condition: '', status: '' };

  assetTypes    = ['ROAD', 'LIGHT', 'BIN'];
  conditions    = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];
  statuses      = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'];

  constructor(public auth: AuthService, private svc: AssetService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data ?? r; this.loading = false; },
      error: () => { this.error = 'Failed to load assets.'; this.loading = false; }
    });
  }

  openModal() { this.form = { name: '', type: 'ROAD', location: '', condition: 'GOOD', status: 'ACTIVE', installedAt: '' }; this.showModal = true; }

  submit() {
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); },
      error: () => { this.saving = false; }
    });
  }

  openEdit(a: any) {
    this.editForm = { assetId: a.assetId, condition: a.condition, status: a.status };
    this.showEditModal = true;
  }

  saveEdit() {
    this.savingEdit = true;
    this.svc.update(this.editForm.assetId, { condition: this.editForm.condition, status: this.editForm.status }).subscribe({
      next: () => { this.savingEdit = false; this.showEditModal = false; this.load(); },
      error: () => { this.savingEdit = false; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this asset?')) this.svc.delete(id).subscribe({ next: () => this.load() });
  }

  conditionClass(c: string) {
    const m: Record<string,string> = { EXCELLENT:'badge-approved', GOOD:'badge-approved', FAIR:'badge-pending', POOR:'badge-progress', DAMAGED:'badge-rejected' };
    return m[c] ?? 'badge-pending';
  }
}
