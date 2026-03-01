import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { ConfirmDialogComponent } from './contacts/contact-dialog/contact-dialog.component';
import { environment } from '../environments/environment';

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
export class AppComponent implements OnInit, OnDestroy {
  title = 'ContactsPro';
  showOnlyFavorites = false;
  totalContactsCount = 0;
  groups: any[] = [];
  activeGroupMenu: string | null = null;
  sidebarOpen = false;

  // ✅ FIX: Store handler references so we can properly remove them
  private contactsUpdatedHandler = () => {
    this.loadContactsCount();
    this.loadGroups();
  };

  private exportCSVHandler = () => {
    this.exportCSV();
  };

  constructor(
    private http: HttpClient,
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  ngOnInit(): void {
    this.loadContactsCount();
    this.loadGroups();

    // ✅ FIX: Use stored references for proper cleanup
    window.addEventListener('export-csv', this.exportCSVHandler);
    window.addEventListener('contacts-updated', this.contactsUpdatedHandler);
  }

  // ✅ FIX: Proper cleanup using stored references
  ngOnDestroy(): void {
    window.removeEventListener('export-csv', this.exportCSVHandler);
    window.removeEventListener('contacts-updated', this.contactsUpdatedHandler);
  }

  // ==========================================
  // GROUPS
  // ==========================================

  loadGroups(): void {
    this.groupsService.getGroups().subscribe({
      next: (res) => {
        this.groups = res.groups;
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
      }
    });
  }

  openCreateGroupDialog(): void {
    const dialogRef = this.dialog.open(GroupDialogComponent, {
      width: '500px',
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
            this.showToast('Group created!', 'success');
          },
          error: (err) => {
            const message = err.error?.message || 'Failed to create group';
            this.showToast(message, 'error');
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
      disableClose: true,
      data: { group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupsService.updateGroup(group._id, result).subscribe({
          next: () => {
            this.showToast('Group updated!', 'success');
            this.groups = this.groups.map(g =>
              g._id === group._id
                ? { ...g, name: result.name, color: result.color, icon: result.icon }
                : g
            );
          },
          error: (err) => {
            const message = err.error?.message || 'Failed to update group';
            this.showToast(message, 'error');
          }
        });
      }
    });
  }

  // ✅ FIX: Replaced window.confirm with MatDialog ConfirmDialogComponent
  deleteGroup(group: any, event: Event): void {
    event.stopPropagation();
    this.activeGroupMenu = null;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirm-dialog-panel',
      disableClose: true,
      data: {
        title: 'Delete Group',
        message: `Delete "${group.name}" group? Contacts will NOT be deleted, just untagged.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      // Optimistic update
      this.groups = this.groups.filter(g => g._id !== group._id);

      this.groupsService.deleteGroup(group._id).subscribe({
        next: () => {
          this.showToast(`"${group.name}" deleted!`, 'success');
          if (this.router.url.includes(group._id)) {
            this.router.navigate(['/contacts']);
          }
        },
        error: () => {
          this.showToast('Failed to delete group', 'error');
          this.loadGroups(); // Restore on failure
        }
      });
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
  }

  // ==========================================
  // CONTACTS COUNT
  // ==========================================

  loadContactsCount(): void {
    // ✅ FIX: Use environment.apiUrl instead of duplicated URL logic
    this.http.get<any>(`${environment.apiUrl}/api/contacts?page=1&limit=1`)
      .subscribe({
        next: (res) => {
          Promise.resolve().then(() => {
            this.totalContactsCount = res.totalContacts || 0;
            this.cdr.detectChanges();
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
          window.dispatchEvent(new CustomEvent('export-csv-trigger'));
        }, 500);
      });
    } else {
      window.dispatchEvent(new CustomEvent('export-csv-trigger'));
    }
  }

  // ==========================================
  // FAVORITES
  // ==========================================

  toggleFavorites(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;

    const dispatch = () => {
      window.dispatchEvent(new CustomEvent('toggle-favorites', {
        detail: { showOnlyFavorites: this.showOnlyFavorites }
      }));
    };

    if (this.router.url !== '/contacts') {
      this.router.navigate(['/contacts']).then(() => setTimeout(dispatch, 300));
    } else {
      dispatch();
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
