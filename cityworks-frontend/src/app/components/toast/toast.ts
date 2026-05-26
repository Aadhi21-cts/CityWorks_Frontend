import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toast.toasts"
           class="toast-item toast-{{t.type}}"
           [class.toast-exit]="false">
        <div class="toast-icon">
          <i class="bi" [ngClass]="{
            'bi-x-circle-fill': t.type==='error',
            'bi-check-circle-fill': t.type==='success',
            'bi-exclamation-triangle-fill': t.type==='warning',
            'bi-info-circle-fill': t.type==='info'
          }"></i>
        </div>
        <span class="toast-message">{{ t.message }}</span>
        <button class="toast-close" (click)="toast.dismiss(t.id)" aria-label="Close">
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 380px;
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-size: 0.875rem;
      font-weight: 500;
      pointer-events: all;
      animation: toastIn 0.25s ease;
      line-height: 1.4;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .toast-error   { background:#f8d7da; color:#58151c; border-left:4px solid #dc3545; }
    .toast-success { background:#d1e7dd; color:#0a3622; border-left:4px solid #198754; }
    .toast-warning { background:#fff3cd; color:#856404; border-left:4px solid #ffc107; }
    .toast-info    { background:#cfe2ff; color:#084298; border-left:4px solid #0d6efd; }
    .toast-icon { flex-shrink:0; font-size:1rem; margin-top:1px; }
    .toast-message { flex:1; }
    .toast-close {
      background: none; border: none; cursor: pointer; padding: 0;
      font-size: 1rem; opacity: 0.6; flex-shrink: 0;
      color: inherit; line-height: 1;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
