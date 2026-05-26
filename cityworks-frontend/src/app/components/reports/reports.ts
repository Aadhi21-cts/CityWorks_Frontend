import { Component, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

const BASE = 'http://localhost:7171/api';

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
  selector: 'app-reports',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  reports: any[] = []; auditPackages: any[] = []; error = '';
  loading = true; loadingPackages = false;
  showGenerateModal = false; showPackageModal = false; saving = false;
  reportForm = { scope: 'REQUESTS', parametersJSON: '{}' };
  packageForm = { periodStart: '', periodEnd: '' };
  scopes = ['REQUESTS', 'WORKORDERS', 'MAINTENANCE'];
  activeTab: 'reports' | 'packages' = 'reports';

  constructor(public auth: AuthService, private http: HttpClient, private toast: ToastService) {}

  ngOnInit() { this.loadReports(); }

  loadReports() {
    this.loading = true;
    this.http.get<any>(`${BASE}/reports/all`).subscribe({
      next: r => { this.reports = r.data ?? r; this.loading = false; },
      error: err => { this.toast.error(extractError(err)); this.loading = false; }
    });
  }

  loadPackages() {
    this.loadingPackages = true;
    this.http.get<any>(`${BASE}/audit-packages/all`).subscribe({
      next: r => { this.auditPackages = r.data ?? r; this.loadingPackages = false; },
      error: err => { this.toast.error(extractError(err)); this.loadingPackages = false; }
    });
  }

  setTab(tab: 'reports' | 'packages') {
    this.activeTab = tab;
    if (tab === 'packages' && this.auditPackages.length === 0) this.loadPackages();
  }

  openGenerateModal() { this.reportForm = { scope: 'REQUESTS', parametersJSON: '{}' }; this.showGenerateModal = true; }

  generateReport() {
    this.saving = true;
    this.http.post<any>(`${BASE}/reports`, { scope: this.reportForm.scope, parametersJSON: this.reportForm.parametersJSON, generatedBy: this.auth.getUserId() }).subscribe({
      next: () => { this.saving = false; this.showGenerateModal = false; this.loadReports(); this.toast.success('Report generated successfully.'); },
      error: err => { this.saving = false; this.toast.error(extractError(err)); }
    });
  }

  openPackageModal() { this.packageForm = { periodStart: '', periodEnd: '' }; this.showPackageModal = true; }

  generatePackage() {
    if (!this.packageForm.periodStart || !this.packageForm.periodEnd) { this.toast.warning('Please select both period start and end dates.'); return; }
    this.saving = true;
    this.http.post<any>(`${BASE}/audit-packages`, this.packageForm).subscribe({
      next: () => { this.saving = false; this.showPackageModal = false; this.loadPackages(); this.toast.success('Audit package created successfully.'); },
      error: err => { this.saving = false; this.toast.error(extractError(err)); }
    });
  }
}
