import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private router = inject(Router);

  exportCSV(): void {
    // Navigate to contacts page if not already there
    if (this.router.url !== '/contacts') {
      this.router.navigate(['/contacts']);
    }

    // Trigger CSV export via event
    window.dispatchEvent(new CustomEvent('export-csv'));
  }
}
