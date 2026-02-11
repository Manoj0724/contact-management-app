import { Component, OnInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactsService } from '../services/contacts.service';
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
  ],
  templateUrl: './contacts.component.html'
})
export class ContactsComponent implements OnInit {
  private readonly MIN_SKELETON_TIME = 800;
  displayedColumns: string[] = ['contact', 'mobile', 'city', 'actions'];

  contacts = signal<any[]>([]);
  loading = signal<boolean>(false);
  error = '';

  page = 1;
  limit = 3;
  totalPages = 1;

  sortBy = 'firstName';
  sortOrder: 'asc' | 'desc' = 'asc';
  pageSizeOptions = [3, 5, 10, 20];

  searchText = '';
  isSearchActive = false;
  showAdvancedSearch = false;

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

    if (currentPath === 'search') {
      this.showAdvancedSearch = true;
    }

    // Listen for CSV export from sidebar
    window.addEventListener('export-csv', () => {
      this.exportCSV();
    });
  }

  fetchContacts(): void {
    const startTime = Date.now();
    this.loading.set(true);
    this.error = '';

    this.contactsService
      .getContacts(this.page, this.limit, this.searchText, this.sortBy, this.sortOrder)
      .subscribe({
        next: (res) => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, this.MIN_SKELETON_TIME - elapsed);

          setTimeout(() => {
            this.contacts.set(res.contacts);
            this.totalPages = res.totalPages;
            this.loading.set(false);
          }, remaining);
        },
        error: () => {
          this.error = 'Failed to load contacts';
          if (this.router.url === '/contacts') {
            this.showToast('Failed to load contacts', 'error');
          }
        }
      });
  }

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

  exportCSV(): void {
    const data = this.contacts();

    if (!data || data.length === 0) {
      this.showToast('No contacts to export!', 'error');
      return;
    }

    const headers = ['Title', 'First Name', 'Last Name', 'Mobile 1', 'Mobile 2', 'City', 'State', 'Pincode'];
    const rows = data.map(c => [
      c.title || '',
      c.firstName || '',
      c.lastName || '',
      c.mobile1 || '',
      c.mobile2 || '',
      c.address?.city || '',
      c.address?.state || '',
      c.address?.pincode || ''
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

  onPageSizeChange(): void {
    localStorage.setItem('contacts_page_size', String(this.limit));
    this.page = 1;
    this.fetchContacts();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.fetchContacts();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.fetchContacts();
    }
  }

  goToPage(p: number): void {
    if (p !== this.page) {
      this.page = p;
      this.fetchContacts();
    }
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

  // ✅ DELETE WITH BROWSER CONFIRM
  onDelete(contactId: string, contactName: string): void {
  // ✅ Material Dialog - no more browser confirm()!
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
      error: (error: any) => {
        this.showToast('Failed to delete contact', 'error');
        this.loading.set(false);
      }
    });
  });
}
}
