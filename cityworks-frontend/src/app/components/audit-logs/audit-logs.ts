import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AuditLogService } from '../../services/audit-log.service';

@Component({
  selector: 'app-audit-logs',
  imports: [CommonModule, FormsModule, SlicePipe],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css'
})
export class AuditLogs implements OnInit {
  items: any[] = [];
  loading = true;
  error = '';
  filterService = '';
  filterResource = '';
  filterAction = '';

  constructor(public auth: AuthService, private svc: AuditLogService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data ?? r; this.loading = false; },
      error: () => { this.error = 'Failed to load audit logs.'; this.loading = false; }
    });
  }

  applyFilter() {
    this.loading = true;
    if (this.filterService) {
      this.svc.getByService(this.filterService).subscribe({ next: r => { this.items = r.data ?? r; this.loading = false; }, error: () => { this.loading = false; } });
    } else if (this.filterResource) {
      this.svc.getByResource(this.filterResource).subscribe({ next: r => { this.items = r.data ?? r; this.loading = false; }, error: () => { this.loading = false; } });
    } else if (this.filterAction) {
      this.svc.getByAction(this.filterAction).subscribe({ next: r => { this.items = r.data ?? r; this.loading = false; }, error: () => { this.loading = false; } });
    } else {
      this.load();
    }
  }

  clearFilter() { this.filterService = ''; this.filterResource = ''; this.filterAction = ''; this.load(); }
}
