import { Component, OnInit } from '@angular/core';
import { SlicePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ServiceRequestService } from '../../services/service-request.service';
import { WorkOrderService } from '../../services/work-order.service';
import { AssetService } from '../../services/asset.service';
import { TaskService } from '../../services/task.service';

const BASE = 'http://localhost:7171/api/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  loading = true;

  // ADMIN
  totalUsers = 0; totalAssets = 0; pendingRequests = 0;
  users: any[] = [];
  showCreateUserModal = false; savingUser = false; showCreatePassword = false;
  userForm = { name: '', email: '', username: '', password: '', role: 'WORKER' };
  roles = ['CITIZEN', 'WORKER', 'SUPERVISOR', 'ADMIN', 'AUDITOR'];
  togglingUserId: number | null = null;

  // Edit user
  showEditUserModal = false; savingEditUser = false;
  editUserForm = { id: 0, name: '', email: '', username: '', role: '' };

  // SUPERVISOR
  totalNewRequests = 0; totalPendingRequests = 0; totalPendingWorkOrders = 0; totalPendingTasks = 0;
  recentRequests: any[] = [];

  // WORKER
  totalTasks = 0; totalCompletedTasks = 0; totalPendingTasksWorker = 0;
  myTasks: any[] = []; myWorkOrders: any[] = [];

  // CITIZEN
  totalRequests = 0; myRequests: any[] = [];

  // AUDITOR
  recentAuditLogs: any[] = []; totalAuditLogs = 0;

  constructor(
    public auth: AuthService,
    private requestSvc: ServiceRequestService,
    private workOrderSvc: WorkOrderService,
    private assetSvc: AssetService,
    private taskSvc: TaskService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const role = this.auth.getRole();
    if (role === 'ADMIN') this.loadAdminDashboard();
    else if (role === 'SUPERVISOR') this.loadSupervisorDashboard();
    else if (role === 'WORKER') this.loadWorkerDashboard();
    else if (role === 'CITIZEN') this.loadCitizenDashboard();
    else if (role === 'AUDITOR') this.loadAuditorDashboard();
    else this.loading = false;
  }

  loadAdminDashboard() {
    this.loading = true;
    forkJoin({ users: this.http.get<any>(`${BASE}/users`), assets: this.assetSvc.getAll(), requests: this.requestSvc.getAll() }).subscribe({
      next: ({ users, assets, requests }) => {
        this.users = users.data ?? users;
        this.totalUsers = this.users.length;
        this.totalAssets = (assets.data ?? assets).length;
        this.pendingRequests = (requests.data ?? requests).filter((x: any) => x.status === 'PENDING').length;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  toggleUserStatus(user: any) {
    this.togglingUserId = user.userId;
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.http.put<any>(`${BASE}/users/${user.userId}/status?status=${newStatus}`, {}).subscribe({
      next: (r) => {
        const updated = r.data ?? r;
        const idx = this.users.findIndex(u => u.userId === user.userId);
        if (idx !== -1) { this.users[idx] = { ...this.users[idx], status: updated.status ?? newStatus }; this.users = [...this.users]; }
        this.togglingUserId = null;
      },
      error: () => { this.togglingUserId = null; },
    });
  }

  openCreateUser() {
    this.userForm = { name: '', email: '', username: '', password: '', role: 'WORKER' };
    this.showCreatePassword = false;
    this.showCreateUserModal = true;
  }

  createUser() {
    this.savingUser = true;
    this.http.post<any>(`${BASE}/admin/register`, this.userForm).subscribe({
      next: () => { this.savingUser = false; this.showCreateUserModal = false; this.loadAdminDashboard(); },
      error: () => { this.savingUser = false; },
    });
  }

  openEditUser(user: any) {
    this.editUserForm = { id: user.userId, name: user.name, email: user.email, username: user.username, role: user.role };
    this.showEditUserModal = true;
  }

  saveEditUser() {
    this.savingEditUser = true;
    this.http.put<any>(`${BASE}/users/${this.editUserForm.id}`, this.editUserForm).subscribe({
      next: (r) => {
        const updated = r.data ?? r;
        const idx = this.users.findIndex(u => u.userId === this.editUserForm.id);
        if (idx !== -1) { this.users[idx] = { ...this.users[idx], ...updated }; this.users = [...this.users]; }
        this.savingEditUser = false; this.showEditUserModal = false;
      },
      error: () => { this.savingEditUser = false; },
    });
  }

  loadSupervisorDashboard() {
    this.loading = true;
    this.requestSvc.getAll().subscribe({
      next: (r) => {
        const d = r.data ?? r;
        this.totalNewRequests = d.filter((x: any) => x.status === 'PENDING').length;
        this.totalPendingRequests = d.filter((x: any) => ['PENDING','APPROVED'].includes(x.status)).length;
        this.recentRequests = d.slice(0, 5);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
    this.workOrderSvc.getAll().subscribe({ next: (r) => { this.totalPendingWorkOrders = (r.data ?? r).filter((x: any) => x.status !== 'COMPLETED').length; } });
    this.taskSvc.getAll().subscribe({ next: (r) => { this.totalPendingTasks = (r.data ?? r).filter((x: any) => x.status !== 'COMPLETED').length; } });
  }

  loadWorkerDashboard() {
    this.loading = true;
    const workerId = this.auth.getUserId()!;
    this.taskSvc.getAll().subscribe({
      next: (r) => {
        const d = (r.data ?? r).filter((t: any) => t.assignedTo === workerId);
        this.totalTasks = d.length;
        this.totalCompletedTasks = d.filter((t: any) => t.status === 'COMPLETED').length;
        this.totalPendingTasksWorker = d.filter((t: any) => t.status !== 'COMPLETED').length;
        this.myTasks = d.slice(0, 5); this.loading = false;
      },
      error: () => (this.loading = false),
    });
    this.workOrderSvc.getByWorker(workerId).subscribe({ next: (r) => { this.myWorkOrders = (r.data ?? r).slice(0, 5); } });
  }

  loadCitizenDashboard() {
    this.loading = true;
    this.requestSvc.getByCitizen(this.auth.getUserId()!).subscribe({
      next: (r) => {
        const d = r.data ?? r;
        this.totalRequests = d.length;
        this.pendingRequests = d.filter((x: any) => x.status === 'PENDING').length;
        this.myRequests = d.slice(0, 5); this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  loadAuditorDashboard() {
    this.loading = true;
    this.http.get<any>(`${BASE}/audit-logs/all`).subscribe({
      next: (r) => { const d = r.data ?? r; this.totalAuditLogs = d.length; this.recentAuditLogs = d.slice(0, 10); this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  statusClass(status: string): string {
    const map: Record<string, string> = { PENDING:'badge-pending', APPROVED:'badge-approved', REJECTED:'badge-rejected', IN_PROGRESS:'badge-progress', COMPLETED:'badge-completed', NEW:'badge-pending' };
    return map[status] ?? 'badge-pending';
  }
}
