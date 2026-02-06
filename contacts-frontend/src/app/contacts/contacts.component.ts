import { Component, OnInit, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactsService } from '../services/contacts.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Contact } from '../contacts/models/contact.model';


@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,

  ],
  templateUrl: './contacts.component.html'
})
export class ContactsComponent implements OnInit {
private readonly MIN_SKELETON_TIME = 800; // ms
pendingEditId: string | null = null;
  /* =====================
     TABLE + API STATE
  ====================== */
  contacts = signal<any[]>([]);
loading = signal<boolean>(false);
  error = '';

  page = 1;
  limit = 3;
  totalPages = 1;

  sortBy = 'firstName';
  sortOrder: 'asc' | 'desc' = 'asc';

  pageSizeOptions = [3, 5, 10, 20];

  /* =====================
     SEARCH
  ====================== */
  searchText = '';
  isSearchActive = false;

  /* =====================
   ADVANCED SEARCH VISIBILITY
===================== */
showAdvancedSearch = false;

 // =====================
// ADVANCED SEARCH STATE
// =====================
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

clearAdvancedSearchFields(): void {
  this.advancedSearch = {
    firstName: '',
    lastName: '',
    mobile: '',
    city: ''
  };

  this.advancedErrors = {
    firstName: false,
    lastName: false,
    mobile: false,
    city: false
  };
}

openAdvancedSearch(): void {
  this.showAdvancedSearch = true;
  this.router.navigate(['/search']);
}

closeAdvancedSearch(): void {
  this.showAdvancedSearch = false;
  this.router.navigate(['/']);
}

// =====================
// ADVANCED SEARCH VALIDATION
// =====================
validateAdvancedSearch(): boolean {
  const nameRegex = /^[a-zA-Z\s]*$/;
  const mobileRegex = /^[0-9]{10}$/;

  this.advancedErrors.firstName =
    !!this.advancedSearch.firstName &&
    !nameRegex.test(this.advancedSearch.firstName);

  this.advancedErrors.lastName =
    !!this.advancedSearch.lastName &&
    !nameRegex.test(this.advancedSearch.lastName);

  this.advancedErrors.city =
    !!this.advancedSearch.city &&
    !nameRegex.test(this.advancedSearch.city);

  this.advancedErrors.mobile =
    !!this.advancedSearch.mobile &&
    !mobileRegex.test(this.advancedSearch.mobile);

  return !(
    this.advancedErrors.firstName ||
    this.advancedErrors.lastName ||
    this.advancedErrors.mobile ||
    this.advancedErrors.city
  );
}

// =====================
// APPLY ADVANCED SEARCH
// =====================
applyAdvancedSearch(): void {
  if (!this.validateAdvancedSearch()) return;

  if (this.advancedSearch.mobile) {
    this.searchText = this.advancedSearch.mobile;
  } else if (this.advancedSearch.firstName || this.advancedSearch.lastName) {
    this.searchText =
  `${this.advancedSearch.firstName} ${this.advancedSearch.lastName}`.trim();
  } else if (this.advancedSearch.city) {
    this.searchText = this.advancedSearch.city;
  } else {
    return;
  }

  this.isSearchActive = true;
  this.page = 1;                 // ✅ IMPORTANT
  this.showAdvancedSearch = false;

  this.fetchContacts();          // pagination now works
  this.clearAdvancedSearchFields();
}

  /* =====================
     MODAL (ADD / EDIT)
  ====================== */


  constructor(
  private contactsService: ContactsService,
  private snackBar: MatSnackBar,
  private zone: NgZone,
  private router: Router,
  private route: ActivatedRoute
) {}

  /* =====================
     INIT
  ====================== */
ngOnInit(): void {
  const savedLimit = localStorage.getItem('contacts_page_size');
  if (savedLimit) {
    this.limit = Number(savedLimit);
  }

  const currentPath = this.route.snapshot.routeConfig?.path;

  // ✅ ONLY load contacts on list page
  if (currentPath === 'contacts' || currentPath === '') {
    this.fetchContacts();
  }

  // Advanced search page
  if (currentPath === 'search') {
    this.showAdvancedSearch = true;
  }
}


  /* =====================
     API
  ====================== */
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

// 🔥 OPEN EDIT AFTER DATA LOAD

        }, remaining);
      },
      error: () => {
  this.error = 'Failed to load contacts';

  // 🚫 DO NOT show toast if we are not on contacts page
  if (this.router.url === '/contacts') {
    this.showToast('Failed to load contacts', 'error');
  }
}

    });
}


  /* =====================
     SEARCH
  ====================== */
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

  /* =====================
     CSV EXPORT
  ====================== */
 exportCSV(): void {
  const data = this.contacts(); // ✅ read signal value

  if (!data.length) return;

  const headers = ['First Name', 'Last Name', 'Mobile', 'City'];

  const rows = data.map(c => [
    c.firstName,
    c.lastName,
    c.mobile1,
    c.address?.city || ''
  ]);

  const csv =
    headers.join(',') + '\n' +
    rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts.csv';
  a.click();

  URL.revokeObjectURL(url);
}


  /* =====================
     PAGE SIZE + PAGINATION
  ====================== */
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

 /* =====================
     TOAST
  ====================== */
 showToast(message: string, type: 'success' | 'error' = 'success'): void {
  this.zone.run(() => {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: type === 'success'
        ? ['toast-success']
        : ['toast-error']
    });
  });

}
/* =====================
   DELETE CONTACT
====================== */
onDelete(contactId: string, contactName: string): void {
  // Show confirmation dialog
  const confirmed = confirm(
    `⚠️ Are you sure you want to delete "${contactName}"?\n\nThis action cannot be undone.`
  );

  if (!confirmed) {
    return; // User cancelled
  }

  // Show loading (optional)
  this.loading.set(true);

  // Call the delete API
  this.contactsService.deleteContact(contactId).subscribe({
    next: () => {
      this.showToast('✅ Contact deleted successfully!', 'success');

      // Refresh the contacts list
      this.fetchContacts();
    },
    error: (error) => {
      console.error('Delete error:', error);
      this.showToast('❌ Failed to delete contact', 'error');
      this.loading.set(false);
    }
  });
}

}
