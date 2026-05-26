import { Injectable } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];
  private nextId = 1;

  show(message: string, type: Toast['type'] = 'error', duration = 5000) {
    const id = this.nextId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  error(msg: string) {
    this.show(msg, 'error');
  }
  success(msg: string) {
    this.show(msg, 'success');
  }
  warning(msg: string) {
    this.show(msg, 'warning');
  }
  info(msg: string) {
    this.show(msg, 'info');
  }
}
