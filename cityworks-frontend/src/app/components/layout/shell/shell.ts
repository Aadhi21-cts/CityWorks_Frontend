import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { ToastComponent } from '../../toast/toast';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar, ToastComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class Shell {
  @ViewChild(Sidebar) sidebar!: Sidebar;
  toggleSidebar() { this.sidebar.toggle(); }
}
