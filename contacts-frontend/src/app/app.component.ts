import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { GroupsService } from './services/groups.service';
import { GroupDialogComponent } from './group-dialog/group-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'ContactsPro';
  showOnlyFavorites = false;
  totalContactsCount = 0;
  groups: any[] = [];
  activeGroupMenu: string | null = null;
  sidebarOpen = false;

  private baseUrl = window.location.hostname.includes('localhost')
    ? 'http://localhost:5000'
    : 'https://contact-management-app-1-qyg8.onrender.com';

  constructor(
    private http: HttpClient,
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContactsCount();
    this.loadGroups();

    window.addEventListener('export-csv', () => {
      this.exportCSV();
    });

    window.addEventListener('contacts-updated', () => {
      this.loadContactsCount();
      this.loadGroups();
    });
  }

  // ==========================================
  // SIDEBAR
  // ==========================================

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  // ==========================================
  // GROUPS
  // ==========================================

  loadGroups(): void {
    this.groupsService.getGroups().subscribe({
      next: (res) => {
        this.groups = res.groups;
        console.log('✅ Groups loaded:', this.groups);
      },
      error: (err) => {
        console.error('❌ Failed to load groups:', err);
      }
    });
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(GroupDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupsService.createGroup(result).subscribe({
          next: (res) => {
            const newGroup = {
              _id: res.group._id,
              name: res.group.name,
              color: res.group.color,
              icon: res.group.icon,
              contactCount: 0
            };
            this.groups = [...this.groups, newGroup]
              .sort((a, b) => a.name.localeCompare(b.name));
            this.showToast('✅ Group created!', 'success');
          },
          error: (err) => {
            const message = err.error?.message || 'Failed to create group';
            this.showToast(`❌ ${message}`, 'error');
          }
        });
      }
    });
  }

  openEditGroupDialog(group: any, event: Event): void {
    event.stopPropagation();
    this.activeGroupMenu = null;

    const dialogRef = this.dialog.open(GroupDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: { group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupsService.updateGroup(group._id, result).subscribe({
          next: () => {
            this.showToast('✅ Group updated!', 'success');
            this.groups = this.groups.map(g =>
              g._id === group._id
                ? { ...g, name: result.name, color: result.color, icon: result.icon }
                : g
            );
          },
          error: (err) => {
            const message = err.error?.message || 'Failed to update group';
            this.showToast(`❌ ${message}`, 'error');
          }
        });
      }
    });
  }

  deleteGroup(group: any, event: Event): void {
    event.stopPropagation();
    this.activeGroupMenu = null;

    const confirmed = window.confirm(
      `Delete "${group.name}" group?\n\nContacts will NOT be deleted, just untagged.`
    );

    if (!confirmed) return;

    this.groups = this.groups.filter(g => g._id !== group._id);

    this.groupsService.deleteGroup(group._id).subscribe({
      next: () => {
        this.showToast(`✅ "${group.name}" deleted!`, 'success');
        if (this.router.url.includes(group._id)) {
          this.router.navigate(['/contacts']);
        }
      },
      error: () => {
        this.showToast('❌ Failed to delete group', 'error');
        this.loadGroups();
      }
    });
  }

  filterByGroup(groupId: string, groupName: string): void {
    this.activeGroupMenu = null;
    this.router.navigate(['/contacts'], {
      queryParams: { group: groupId, groupName: groupName }
    });
  }

  toggleGroupMenu(groupId: string, event: Event): void {
    event.stopPropagation();
    this.activeGroupMenu = this.activeGroupMenu === groupId ? null : groupId;
  }

  closeAllMenus(): void {
    this.activeGroupMenu = null;
    this.sidebarOpen = false;
  }

  // ==========================================
  // CONTACTS COUNT
  // ==========================================

  loadContactsCount(): void {
  const url = window.location.hostname.includes('localhost')
    ? 'http://localhost:5000/api/contacts?page=1&limit=1'
    : 'https://contact-management-app-1-qyg8.onrender.com/api/contacts?page=1&limit=1';

  this.http.get<any>(url).subscribe({
    next: (res) => {
      Promise.resolve().then(() => {
        this.totalContactsCount = res.totalContacts || 0;
      });
    },
    error: () => {
      this.totalContactsCount = 0;
    }
  });
}

  // ==========================================
  // CSV EXPORT
  // ==========================================

  exportCSV(): void {
    if (this.router.url !== '/contacts') {
      this.router.navigate(['/contacts']).then(() => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('export-csv'));
        }, 1000);
      });
    } else {
      window.dispatchEvent(new CustomEvent('export-csv'));
    }
  }

  // ==========================================
  // FAVORITES
  // ==========================================

  toggleFavorites(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;

    if (this.router.url !== '/contacts') {
      this.router.navigate(['/contacts']).then(() => {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('toggle-favorites', {
            detail: { showOnlyFavorites: this.showOnlyFavorites }
          }));
        }, 500);
      });
    } else {
      window.dispatchEvent(new CustomEvent('toggle-favorites', {
        detail: { showOnlyFavorites: this.showOnlyFavorites }
      }));
    }
  }

  // ==========================================
  // TOAST
  // ==========================================

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['toast-success'] : ['toast-error']
    });
  }

  clearGroupFilter(): void {
    this.router.navigate(['/contacts']);
  }
}
