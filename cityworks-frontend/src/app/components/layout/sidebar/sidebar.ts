import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  isOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  toggle() { this.isOpen = !this.isOpen; }
  close()  { this.isOpen = false; }

  // Close sidebar on route change (mobile)
  logout() {
    this.isOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  is(...roles: string[]): boolean {
    return this.auth.hasRole(...roles);
  }

  // Close on Escape key
  @HostListener('document:keydown.escape')
  onEscape() { this.isOpen = false; }
}
