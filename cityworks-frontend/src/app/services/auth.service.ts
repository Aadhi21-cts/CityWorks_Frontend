import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.models';

const API = 'http://localhost:7171/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(body: LoginRequest): Observable<any> {
    return this.http.post<any>(`${API}/login`, body).pipe(
      tap((res) => {
        const data = res.data || res;
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          localStorage.setItem('username', body.username);
          localStorage.setItem('userId', data.userId);
        }
      }),
    );
  }

  register(body: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${API}/register`, body);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getRole(): string | null {
    return localStorage.getItem('role');
  }
  getUsername(): string | null {
    return localStorage.getItem('username');
  }
  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  hasRole(...roles: string[]): boolean {
    return roles.includes(this.getRole() ?? '');
  }
}
