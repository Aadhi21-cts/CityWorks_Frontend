import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  name = '';
  username = '';
  password = '';
  email = '';
  showPassword = false;
  error = '';
  success = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit() {
    this.error = '';
    this.success = '';
    this.loading = true;
    this.auth
      .register({
        name: this.name,
        username: this.username,
        password: this.password,
        email: this.email,
        role: 'CITIZEN',
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = 'Registration successful! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Registration failed.';
        },
      });
  }
}
