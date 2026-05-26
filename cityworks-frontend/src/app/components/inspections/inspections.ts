import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InspectionService } from '../../services/inspection.service';
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
  selector: 'app-inspections',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './inspections.html',
  styleUrl: './inspections.css'
})
export class Inspections implements OnInit {
  items: any[] = [];
  loading = true; error = '';
  showModal = false; saving = false; formSubmitted = false;
  form = { assetId: 0, performedAt: '', conditionRating: 3, findings: '', photoFile: null as File | null, photoFileName: '', status: 'PENDING' };
  statuses = ['PENDING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED'];
  assets: any[] = [];
  showEditModal = false; savingEdit = false; editFormSubmitted = false;
  editForm = { inspectionId: 0, assetId: 0, performedAt: '', conditionRating: 3, findings: '', photoFile: null as File | null, photoFileName: '', status: 'PENDING' };

  constructor(public auth: AuthService, private svc: InspectionService, private assetSvc: AssetService, private toast: ToastService) {}

  ngOnInit() {
    this.load();
    this.assetSvc.getAll().subscribe({ next: r => { this.assets = r.data ?? r; }, error: () => {} });
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
    this.form = { assetId: 0, performedAt: '', conditionRating: 3, findings: '', photoFile: null, photoFileName: '', status: 'PENDING' };
    this.formSubmitted = false; this.showModal = true;
  }

  onPhotoSelected(event: Event, mode: 'create' | 'edit') {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      if (mode === 'create') { this.form.photoFile = input.files[0]; this.form.photoFileName = input.files[0].name; }
      else { this.editForm.photoFile = input.files[0]; this.editForm.photoFileName = input.files[0].name; }
    }
  }

  isCreateValid(): boolean {
    return this.form.assetId > 0 && !!this.form.performedAt && !!this.form.findings.trim();
  }

  submit() {
    this.formSubmitted = true;
    if (!this.isCreateValid()) { this.toast.warning('Please fill in all required fields.'); return; }
    this.saving = true;
    const photoUri = this.form.photoFile ? URL.createObjectURL(this.form.photoFile) : '';
    this.svc.create({ assetId: this.form.assetId, performedAt: this.form.performedAt, conditionRating: this.form.conditionRating, findings: this.form.findings, photoUri, status: this.form.status }).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); this.toast.success('Inspection created successfully.'); },
      error: err => { this.saving = false; this.toast.error(extractError(err)); }
    });
  }

  openEdit(i: any) {
    this.editForm = { inspectionId: i.inspectionId, assetId: i.assetId, performedAt: i.performedAt, conditionRating: i.conditionRating, findings: i.findings, photoFile: null, photoFileName: '', status: i.status };
    this.editFormSubmitted = false; this.showEditModal = true;
  }

  saveEdit() {
    this.editFormSubmitted = true;
    if (!this.editForm.assetId || !this.editForm.performedAt || !this.editForm.findings.trim()) {
      this.toast.warning('Please fill in all required fields.'); return;
    }
    this.savingEdit = true;
    const photoUri = this.editForm.photoFile ? URL.createObjectURL(this.editForm.photoFile) : undefined;
    const body: any = { assetId: this.editForm.assetId, performedAt: this.editForm.performedAt, conditionRating: this.editForm.conditionRating, findings: this.editForm.findings, status: this.editForm.status };
    if (photoUri) body.photoUri = photoUri;
    this.svc.update(this.editForm.inspectionId, body).subscribe({
      next: () => { this.savingEdit = false; this.showEditModal = false; this.load(); this.toast.success('Inspection updated successfully.'); },
      error: err => { this.savingEdit = false; this.toast.error(extractError(err)); }
    });
  }

  delete(id: number) {
    if (confirm('Delete this inspection?')) {
      this.svc.delete(id).subscribe({
        next: () => { this.load(); this.toast.success('Inspection deleted.'); },
        error: err => this.toast.error(extractError(err))
      });
    }
  }

  ratingStars(r: number) { return '★'.repeat(r) + '☆'.repeat(5 - r); }
}
