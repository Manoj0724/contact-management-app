import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContactsService } from '../../services/contacts.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Contact } from '../models/contact.model';

@Component({
  selector: 'app-new-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './new-contact.component.html'
})
export class NewContactComponent {

  saving = false;

  // FIX: Use Contact['title'] so TypeScript knows the exact allowed values
  form: {
    title: Contact['title'];
    firstName: string;
    lastName: string;
    mobile1: string;
    mobile2: string;
    city: string;
    state: string;
    pincode: string;
  } = {
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
    private contactsService: ContactsService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {}

  save(): void {
    if (!this.isFormValid()) {
      this.showToast('Please fill all mandatory fields correctly!', 'error');
      return;
    }

    this.saving = true;

    const payload: Partial<Contact> = {
      title: this.form.title,
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      mobile1: this.form.mobile1,
      mobile2: this.form.mobile2 || undefined,
      address: {
        city: this.form.city.trim(),
        state: this.form.state.trim(),
        pincode: this.form.pincode
      }
    };

    this.contactsService.createContact(payload).subscribe({
      next: () => {
        this.showToast('Contact added successfully!', 'success');
        this.saving = false;
        this.router.navigate(['/contacts']);
      },
      error: () => {
        this.showToast('Failed to save contact. Please try again.', 'error');
        this.saving = false;
      }
    });
  }

  isFormValid(): boolean {
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
    this.router.navigate(['/contacts']);
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.zone.run(() => {
      this.snackBar.open(message, 'x', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: type === 'success' ? ['toast-success'] : ['toast-error']
      });
    });
  }
}
