import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '../../services/contacts.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-contact.component.html'
})
export class EditContactComponent implements OnInit {

  contactId = '';
  errorMessage = '';
  loading = false;         // ← ADDED: used in HTML *ngIf="loading"

  form = {
    title: '',
    firstName: '',
    lastName: '',
    mobile1: '',
    mobile2: '',
    city: '',
    state: '',
    pincode: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactsService: ContactsService,
    private cdr: ChangeDetectorRef,  // ← FIXED: now properly imported above
    private snackBar: MatSnackBar,   // ← ADDED: for toast notifications
    private zone: NgZone             // ← ADDED: for zone-safe toasts
  ) {}

  ngOnInit(): void {
    this.contactId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.contactId) {
      this.errorMessage = 'No contact ID provided';
      return;
    }

    this.loadContact();
  }

  loadContact(): void {
    this.loading = true;    // ← Show spinner while loading

    this.contactsService.getContactById(this.contactId).subscribe({
      next: (response: any) => {
        if (!response) {
          this.errorMessage = 'Invalid response from server';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.form = {
          title: response.title || '',
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          mobile1: response.mobile1 || '',
          mobile2: response.mobile2 || '',
          city: response.address?.city || '',
          state: response.address?.state || '',
          pincode: response.address?.pincode || ''
        };

        this.loading = false;   // ← Hide spinner after data loads
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = `Failed to load contact: ${error.status} - ${error.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onUpdate(): void {
  const payload = {
    title: this.form.title,
    firstName: this.form.firstName,
    lastName: this.form.lastName,
    mobile1: this.form.mobile1,
    mobile2: this.form.mobile2 || undefined,
    address: {
      city: this.form.city,
      state: this.form.state,
      pincode: this.form.pincode
    }
  };

  this.contactsService.updateContact(this.contactId, payload).subscribe({
    next: () => {
      // ✅ Material toast - no more alert()
      this.showToast('Contact updated successfully!', 'success');
      setTimeout(() => this.router.navigate(['/contacts']), 1000);
    },
    error: (error: any) => {
      // ✅ Material toast - no more alert()
      this.showToast('Failed to update contact: ' + error.message, 'error');
    }
  });
}

  validateForm(): boolean {
    if (!this.form.title) return false;
    if (!this.form.firstName || !/^[a-zA-Z\s]+$/.test(this.form.firstName)) return false;
    if (!this.form.lastName || !/^[a-zA-Z\s]+$/.test(this.form.lastName)) return false;
    if (!this.form.mobile1 || !/^[0-9]{10}$/.test(this.form.mobile1)) return false;
    if (this.form.mobile2 && !/^[0-9]{10}$/.test(this.form.mobile2)) return false;
    if (!this.form.city || !/^[a-zA-Z\s]+$/.test(this.form.city)) return false;
    if (!this.form.state || !/^[a-zA-Z\s]+$/.test(this.form.state)) return false;
    if (!this.form.pincode || !/^[0-9]{6}$/.test(this.form.pincode)) return false;
    return true;
  }

  cancel(): void {
    // ← ADDED: was missing, used in HTML (click)="cancel()"
    this.router.navigate(['/contacts']);
  }

 showToast(
  message: string,
  type: 'success' | 'error' | 'warning' = 'success'
): void {
  this.zone.run(() => {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`toast-${type}`]
    });
  });
}
}
