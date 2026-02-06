import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '../../services/contacts.service';

@Component({
  selector: 'app-edit-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-contact.component.html'
})
export class EditContactComponent implements OnInit {

  contactId = '';
  errorMessage = '';

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
    private cdr: ChangeDetectorRef
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
    this.contactsService.getContactById(this.contactId).subscribe({
      next: (response: any) => {
        if (!response) {
          this.errorMessage = 'Invalid response from server';
          this.cdr.detectChanges();
          return;
        }

        // Map the data
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

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = `Failed to load contact: ${error.status} - ${error.message}`;
        this.cdr.detectChanges();
      }
    });
  }

  onUpdate(): void {
    // Validate form before submitting
    if (!this.validateForm()) {
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

    this.contactsService.updateContact(this.contactId, payload).subscribe({
      next: () => {
        alert('✅ Contact updated successfully!');
        this.router.navigate(['/contacts']);
      },
      error: (error) => {
        alert('❌ Update failed: ' + error.message);
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

  goBack(): void {
    this.router.navigate(['/contacts']);
  }
}
