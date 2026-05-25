import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InspectionService } from '../../services/inspection.service';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-inspections',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './inspections.html',
  styleUrl: './inspections.css'
})
export class Inspections implements OnInit {
  items: any[] = [];
  loading = true; error = '';
  showModal = false; saving = false;
  form = { assetId: 0, performedAt: '', conditionRating: 3, findings: '', photoFile: null as File | null, photoFileName: '', status: 'PENDING' };
  statuses = ['PENDING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED'];
  assets: any[] = [];

  // Edit modal
  showEditModal = false; savingEdit = false;
  editForm = { inspectionId: 0, assetId: 0, performedAt: '', conditionRating: 3, findings: '', photoFile: null as File | null, photoFileName: '', status: 'PENDING' };

  constructor(
    public auth: AuthService,
    private svc: InspectionService,
    private assetSvc: AssetService
  ) {}

  ngOnInit() {
    this.load();
    this.assetSvc.getAll().subscribe({ next: r => { this.assets = r.data ?? r; }, error: () => {} });
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data ?? r; this.loading = false; },
      error: () => { this.error = 'Failed to load inspections.'; this.loading = false; }
    });
  }

  assetLabel(id: number): string {
    const a = this.assets.find(x => x.assetId === id);
    return a ? `#${a.assetId} — ${a.name} — ${a.location}` : `#${id}`;
  }

  openModal() {
    this.form = { assetId: 0, performedAt: '', conditionRating: 3, findings: '', photoFile: null, photoFileName: '', status: 'PENDING' };
    this.showModal = true;
  }

  onPhotoSelected(event: Event, mode: 'create' | 'edit') {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      if (mode === 'create') { this.form.photoFile = input.files[0]; this.form.photoFileName = input.files[0].name; }
      else { this.editForm.photoFile = input.files[0]; this.editForm.photoFileName = input.files[0].name; }
    }
  }

  submit() {
    this.saving = true;
    const photoUri = this.form.photoFile ? URL.createObjectURL(this.form.photoFile) : '';
    this.svc.create({ assetId: this.form.assetId, performedAt: this.form.performedAt, conditionRating: this.form.conditionRating, findings: this.form.findings, photoUri, status: this.form.status }).subscribe({
      next: () => { this.saving = false; this.showModal = false; this.load(); },
      error: () => { this.saving = false; }
    });
  }

  openEdit(i: any) {
    this.editForm = { inspectionId: i.inspectionId, assetId: i.assetId, performedAt: i.performedAt, conditionRating: i.conditionRating, findings: i.findings, photoFile: null, photoFileName: '', status: i.status };
    this.showEditModal = true;
  }

  saveEdit() {
    this.savingEdit = true;
    const photoUri = this.editForm.photoFile ? URL.createObjectURL(this.editForm.photoFile) : undefined;
    const body: any = { assetId: this.editForm.assetId, performedAt: this.editForm.performedAt, conditionRating: this.editForm.conditionRating, findings: this.editForm.findings, status: this.editForm.status };
    if (photoUri) body.photoUri = photoUri;
    this.svc.update(this.editForm.inspectionId, body).subscribe({
      next: () => { this.savingEdit = false; this.showEditModal = false; this.load(); },
      error: () => { this.savingEdit = false; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this inspection?')) this.svc.delete(id).subscribe({ next: () => this.load() });
  }

  ratingStars(r: number) { return '★'.repeat(r) + '☆'.repeat(5 - r); }
}
