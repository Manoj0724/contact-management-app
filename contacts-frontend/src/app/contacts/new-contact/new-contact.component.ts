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
    private contactsService: ContactsService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {}

  save(): void {
    // Validate form before submitting
    if (!this.isFormValid()) {
      alert('⚠️ Please fill all mandatory fields correctly!');
      return;
    }

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

    this.contactsService.createContact(payload).subscribe({
      next: () => {
        this.showToast('✅ Contact added successfully!', 'success');
        this.router.navigate(['/contacts']);
      },
      error: (error) => {
        this.showToast('❌ Failed to save contact', 'error');
      }
    });
  }

  isFormValid(): boolean {
    // Check all required fields
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
      this.snackBar.open(message, '✕', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: type === 'success' ? ['toast-success'] : ['toast-error']
      });
    });
  }
}
