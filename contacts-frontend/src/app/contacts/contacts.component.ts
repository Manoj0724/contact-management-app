import { Component, OnInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactsService } from '../services/contacts.service';
import { GroupsService } from '../services/groups.service';           // ✅ NEW IMPORT
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './contact-dialog/contact-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './contacts.component.html',
})
export class ContactsComponent implements OnInit {

  private readonly MIN_SKELETON_TIME = 800;

  displayedColumns: string[] = ['select', 'contact', 'mobile', 'city', 'actions'];

  // Group filter
  filterGroupId: string = '';
  filterGroupName: string = '';

  // ✅ NEW: Available groups for bulk assign dropdown
  availableGroups: any[] = [];

  // Bulk operations
  selectedContacts = signal<Set<string>>(new Set());
  selectAll: boolean = false;
  bulkActionInProgress = signal<boolean>(false);

  contacts = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = '';

  // ✅ NEW: Total contacts count for header
  totalContacts = 0;

  page = 1;
  limit = 3;
  totalPages = 1;

  sortBy = 'firstName';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSizeOptions = [3, 5, 10, 20];

  searchText = '';
  isSearchActive = false;
  showAdvancedSearch = false;

  showFavoritesOnly = false;

  advancedSearch = {
    firstName: '',
    lastName: '',
    mobile: '',
    city: ''
  };

  advancedErrors = {
    firstName: false,
    lastName: false,
    mobile: false,
    city: false
  };

  constructor(
    private contactsService: ContactsService,
    private groupsService: GroupsService,           // ✅ NEW: inject GroupsService
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const savedLimit = localStorage.getItem('contacts_page_size');
    if (savedLimit) {
      this.limit = Number(savedLimit);
    }

    const currentPath = this.route.snapshot.routeConfig?.path;

    if (currentPath === 'contacts' || currentPath === '') {
      this.fetchContacts();
    }

    // ✅ Group filter from URL query params
    this.route.queryParams.subscribe(params => {
  if (params['group']) {
    this.filterGroupId = params['group'];
    this.filterGroupName = params['groupName'] || '';
  } else {
    // ✅ Clear group filter when no group param
    this.filterGroupId = '';
    this.filterGroupName = '';
  }
  // ✅ Always fetch when params change
  this.page = 1;
  this.fetchContacts();
});
    if (currentPath === 'search') {
      this.showAdvancedSearch = true;
    }

    // Listen for CSV export from sidebar
    window.addEventListener('export-csv', () => {
      this.exportCSV();
    });

    // Listen for favorites toggle from sidebar
    window.addEventListener('toggle-favorites', ((e: CustomEvent) => {
      this.showFavoritesOnly = e.detail.showOnlyFavorites;
      this.page = 1;
      this.fetchContacts();
    }) as EventListener);

    // ✅ NEW: Load available groups for bulk assign dropdown
    this.loadAvailableGroups();

    // ✅ NEW: Reload groups when contacts updated (e.g. after group created)
    window.addEventListener('contacts-updated', () => {
      this.loadAvailableGroups();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('export-csv', () => {});
    window.removeEventListener('toggle-favorites', () => {});
    window.removeEventListener('contacts-updated', () => {});
  }

  // ==========================================
  // ✅ NEW: Load Groups for Bulk Dropdown
  // ==========================================
  loadAvailableGroups(): void {
    this.groupsService.getGroups().subscribe({
      next: (res) => {
        this.availableGroups = res.groups || [];
      },
      error: () => {
        this.availableGroups = [];
      }
    });
  }

  // ==========================================
  // ✅ NEW: Get group name by ID (for badges)
  // ==========================================
  getGroupName(groupIdOrObj: any): string {
    if (!groupIdOrObj) return '';
    const id = typeof groupIdOrObj === 'object' ? groupIdOrObj._id : groupIdOrObj;
    const group = this.availableGroups.find(g => g._id === id);
    return group ? group.name : '';
  }

  // ==========================================
  // ✅ NEW: Get group color by ID (for badges)
  // ==========================================
  getGroupColor(groupIdOrObj: any): string {
    if (!groupIdOrObj) return '#6b7280';
    const id = typeof groupIdOrObj === 'object' ? groupIdOrObj._id : groupIdOrObj;
    const group = this.availableGroups.find(g => g._id === id);
    return group ? group.color : '#6b7280';
  }

  // ==========================================
  // FETCH CONTACTS
  // ==========================================
  fetchContacts(): void {
    const startTime = Date.now();
    this.loading.set(true);
    this.error = '';

    this.contactsService
      .getContacts(
        this.page,
        this.limit,
        this.searchText,
        this.sortBy,
        this.sortOrder,
        this.showFavoritesOnly,
        this.filterGroupId       // ✅ group filter param
      )
      .subscribe({
        next: (res) => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, this.MIN_SKELETON_TIME - elapsed);

          setTimeout(() => {
            this.contacts.set(res.contacts || []);
            this.totalPages = res.totalPages || 1;
            this.totalContacts = res.totalContacts || 0; // ✅ store total
            this.loading.set(false);
            window.dispatchEvent(new CustomEvent('contacts-updated'));
          }, remaining);
        },
        error: (err) => {
          console.error('❌ API Error:', err);
          this.error = 'Failed to load contacts';
          this.loading.set(false);
          this.showToast('Failed to load contacts', 'error');
        }
      });
  }

  // ==========================================
  // SEARCH
  // ==========================================
  onSearchOrClear(): void {
    if (this.isSearchActive) {
      this.searchText = '';
      this.isSearchActive = false;
      this.page = 1;
      this.clearAdvancedSearchFields();
      this.fetchContacts();
      return;
    }
    if (!this.searchText.trim()) return;
    this.isSearchActive = true;
    this.page = 1;
    this.fetchContacts();
  }

  clearAdvancedSearchFields(): void {
    this.advancedSearch = { firstName: '', lastName: '', mobile: '', city: '' };
    this.advancedErrors = { firstName: false, lastName: false, mobile: false, city: false };
  }

  openAdvancedSearch(): void {
    this.showAdvancedSearch = true;
  }

  closeAdvancedSearch(): void {
    this.showAdvancedSearch = false;
  }

  validateAdvancedSearch(): boolean {
    const nameRegex = /^[a-zA-Z\s]*$/;
    const mobileRegex = /^[0-9]{10}$/;
    this.advancedErrors.firstName = !!this.advancedSearch.firstName && !nameRegex.test(this.advancedSearch.firstName);
    this.advancedErrors.lastName = !!this.advancedSearch.lastName && !nameRegex.test(this.advancedSearch.lastName);
    this.advancedErrors.city = !!this.advancedSearch.city && !nameRegex.test(this.advancedSearch.city);
    this.advancedErrors.mobile = !!this.advancedSearch.mobile && !mobileRegex.test(this.advancedSearch.mobile);
    return !(this.advancedErrors.firstName || this.advancedErrors.lastName || this.advancedErrors.mobile || this.advancedErrors.city);
  }

  applyAdvancedSearch(): void {
    if (!this.validateAdvancedSearch()) return;
    if (this.advancedSearch.mobile) {
      this.searchText = this.advancedSearch.mobile;
    } else if (this.advancedSearch.firstName || this.advancedSearch.lastName) {
      this.searchText = `${this.advancedSearch.firstName} ${this.advancedSearch.lastName}`.trim();
    } else if (this.advancedSearch.city) {
      this.searchText = this.advancedSearch.city;
    } else {
      return;
    }
    this.isSearchActive = true;
    this.page = 1;
    this.showAdvancedSearch = false;
    this.fetchContacts();
    this.clearAdvancedSearchFields();
  }

  // ==========================================
  // CSV EXPORT
  // ==========================================
  exportCSV(): void {
    const data = this.contacts();
    if (!data || data.length === 0) {
      this.showToast('No contacts to export!', 'error');
      return;
    }
    const headers = ['Title', 'First Name', 'Last Name', 'Mobile 1', 'Mobile 2', 'City', 'State', 'Pincode'];
    const rows = data.map(c => [
      c.title || '', c.firstName || '', c.lastName || '',
      c.mobile1 || '', c.mobile2 || '',
      c.address?.city || '', c.address?.state || '', c.address?.pincode || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contacts.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    this.showToast('✅ CSV exported successfully!', 'success');
  }

  // ==========================================
  // PAGINATION
  // ==========================================
  onPageSizeChange(): void {
    localStorage.setItem('contacts_page_size', String(this.limit));
    this.page = 1;
    this.fetchContacts();
  }

  nextPage(): void {
    if (this.page < this.totalPages) { this.page++; this.fetchContacts(); }
  }

  prevPage(): void {
    if (this.page > 1) { this.page--; this.fetchContacts(); }
  }

  goToPage(p: number): void {
    if (p !== this.page) { this.page = p; this.fetchContacts(); }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  toggleSort(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.page = 1;
    this.fetchContacts();
  }

  // ==========================================
  // TOAST
  // ==========================================
  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.zone.run(() => {
      this.snackBar.open(message, '✕', {
        duration: 3500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: type === 'success' ? ['toast-success'] : ['toast-error']
      });
    });
  }

  // ==========================================
  // DELETE
  // ==========================================
  onDelete(contactId: string, contactName: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirm-dialog-panel',
      disableClose: true,
      data: {
        title: 'Delete Contact',
        message: `Are you sure you want to delete "${contactName}"? This action cannot be undone.`,
        confirmText: 'Yes, Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.loading.set(true);
      this.contactsService.deleteContact(contactId).subscribe({
        next: () => {
          this.showToast('Contact deleted successfully!', 'success');
          this.fetchContacts();
        },
        error: () => {
          this.showToast('Failed to delete contact', 'error');
          this.loading.set(false);
        }
      });
    });
  }

  // ==========================================
  // FAVORITES
  // ==========================================
  toggleFavorite(contactId: string, currentStatus: boolean): void {
    const newStatus = !currentStatus;
    this.contactsService.toggleFavorite(contactId, newStatus).subscribe({
      next: () => {
        const currentContacts = this.contacts();
        const index = currentContacts.findIndex(c => c._id === contactId);
        if (index !== -1) {
          currentContacts[index].isFavorite = newStatus;
          this.contacts.set([...currentContacts]);
        }
        this.showToast(
          newStatus ? '⭐ Added to favorites!' : 'Removed from favorites',
          'success'
        );
      },
      error: () => {
        this.showToast('Failed to update favorite', 'error');
      }
    });
  }

  filterFavorites(): void {
    this.showFavoritesOnly = true;
    this.page = 1;
    this.fetchContacts();
  }

  showAllContacts(): void {
    this.showFavoritesOnly = false;
    this.page = 1;
    this.fetchContacts();
  }

  // ==========================================
  // GROUP FILTER
  // ==========================================
  clearGroupFilter(): void {
    this.filterGroupId = '';
    this.filterGroupName = '';
    this.router.navigate(['/contacts']);
    this.fetchContacts();
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================
  toggleSelectAll(): void {
    const current = new Set(this.selectedContacts());
    if (this.selectAll) {
      this.contacts().map(c => c._id).forEach(id => current.delete(id));
      this.selectAll = false;
    } else {
      this.contacts().map(c => c._id).forEach(id => current.add(id));
      this.selectAll = true;
    }
    this.selectedContacts.set(current);
  }

  toggleSelectContact(contactId: string): void {
    const current = new Set(this.selectedContacts());
    if (current.has(contactId)) {
      current.delete(contactId);
    } else {
      current.add(contactId);
    }
    this.selectedContacts.set(current);
    const currentPageIds = this.contacts().map(c => c._id);
    this.selectAll = currentPageIds.every(id => current.has(id));
  }

  isSelected(contactId: string): boolean {
    return this.selectedContacts().has(contactId);
  }

  getSelectedCount(): number {
    return this.selectedContacts().size;
  }

  clearSelection(): void {
    this.selectedContacts.set(new Set());
    this.selectAll = false;
  }

  bulkDeleteContacts(): void {
    if (this.selectedContacts().size === 0) {
      this.showToast('Please select contacts to delete', 'error');
      return;
    }
    const count = this.selectedContacts().size;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      panelClass: 'confirm-dialog-panel',
      disableClose: true,
      data: {
        title: 'Bulk Delete Contacts',
        message: `Are you sure you want to delete ${count} contact(s)?`,
        confirmText: 'Yes, Delete All',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.bulkActionInProgress.set(true);
      const ids = Array.from(this.selectedContacts());
      this.contactsService.bulkDelete(ids).subscribe({
        next: (response) => {
          this.showToast(`${response.deleted} contact(s) deleted!`, 'success');
          this.clearSelection();
          this.fetchContacts();
          this.bulkActionInProgress.set(false);
        },
        error: () => {
          this.showToast('Failed to delete contacts', 'error');
          this.bulkActionInProgress.set(false);
        }
      });
    });
  }

  bulkExportContacts(): void {
    if (this.selectedContacts().size === 0) {
      this.showToast('Please select contacts to export', 'error');
      return;
    }
    const selectedData = this.contacts().filter(c => this.selectedContacts().has(c._id));
    const headers = ['Title', 'First Name', 'Last Name', 'Mobile 1', 'City'];
    const rows = selectedData.map(c => [
      c.title || '', c.firstName || '', c.lastName || '',
      c.mobile1 || '', c.address?.city || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-selected-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    this.showToast(`✅ ${selectedData.length} contact(s) exported!`, 'success');
    this.clearSelection();
  }

  // ✅ REMOVED: bulkAddToFavorites (removed from UI)
  // ✅ REMOVED: bulkRemoveFromFavorites (removed from UI)

  // ==========================================
  // ✅ NEW: BULK ASSIGN TO GROUP
  // ==========================================
  bulkAssignToGroup(event: any): void {
    const groupId = event.target.value;
    if (!groupId) return;

    const ids = Array.from(this.selectedContacts());
    if (ids.length === 0) {
      this.showToast('Please select contacts first', 'error');
      event.target.value = '';
      return;
    }

    this.bulkActionInProgress.set(true);

    // Update each contact with the group
    const requests = ids.map(id =>
      this.contactsService.updateContact(id as string, {
        $addToSet: { groups: groupId }
      }).toPromise()
    );

    Promise.all(requests)
      .then(() => {
        this.showToast(`✅ ${ids.length} contacts assigned to group!`, 'success');
        this.clearSelection();
        this.fetchContacts();
        this.bulkActionInProgress.set(false);
        event.target.value = '';
        window.dispatchEvent(new CustomEvent('contacts-updated'));
      })
      .catch(() => {
        this.showToast('❌ Failed to assign group', 'error');
        this.bulkActionInProgress.set(false);
        event.target.value = '';
      });
  }
}
