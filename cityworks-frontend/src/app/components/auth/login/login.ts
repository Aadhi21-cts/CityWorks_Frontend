import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

const BASE = 'http://localhost:7171/api/auth';

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
  selector: 'app-login',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  username = ''; password = ''; showPassword = false;
  error = ''; loading = false;
  showForgotUsername = false; forgotUsernameEmail = ''; forgotUsernameMsg = ''; forgotUsernameLoading = false;
  showForgotPassword = false; forgotPasswordUsername = ''; forgotPasswordMsg = ''; forgotPasswordLoading = false;
  resetToken = ''; newPassword = ''; showNewPassword = false; resetMsg = ''; resetLoading = false; tokenReceived = false;

  constructor(private auth: AuthService, private router: Router, private http: HttpClient, private toast: ToastService) {}

  submit() {
    this.error = ''; this.loading = true;
    this.auth.login({ username: this.username, password: this.password, role: '' }).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: (err) => { this.loading = false; this.error = extractError(err); },
    });
  }

  submitForgotUsername() {
    this.forgotUsernameLoading = true; this.forgotUsernameMsg = '';
    this.http.post<any>(`${BASE}/forgot-username`, { email: this.forgotUsernameEmail }).subscribe({
      next: (r) => { this.forgotUsernameMsg = r.message ?? 'Username sent.'; this.forgotUsernameLoading = false; },
      error: (err) => { this.forgotUsernameMsg = extractError(err); this.forgotUsernameLoading = false; },
    });
  }

  submitForgotPassword() {
    this.forgotPasswordLoading = true; this.forgotPasswordMsg = '';
    this.http.post<any>(`${BASE}/forgot-password`, { username: this.forgotPasswordUsername }).subscribe({
      next: (r) => { this.forgotPasswordMsg = r.message ?? 'Reset token generated. Check the server console for your token.'; this.forgotPasswordLoading = false; this.tokenReceived = true; },
      error: (err) => { this.forgotPasswordMsg = extractError(err); this.forgotPasswordLoading = false; },
    });
  }

  submitResetPassword() {
    this.resetLoading = true; this.resetMsg = '';
    this.http.post<any>(`${BASE}/reset-password`, { token: this.resetToken, newPassword: this.newPassword }).subscribe({
      next: (r) => {
        this.resetMsg = r.message ?? 'Password reset successful!';
        this.resetLoading = false;
        setTimeout(() => { this.showForgotPassword = false; this.tokenReceived = false; }, 2000);
      },
      error: (err) => { this.resetMsg = extractError(err); this.resetLoading = false; },
    });
  }
}
