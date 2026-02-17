import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService } from '../../services/contacts.service';
import { GroupsService } from '../../services/groups.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
    MatCheckboxModule
  ],
  templateUrl: './edit-contact.component.html'
})
export class EditContactComponent implements OnInit {

  contactId = '';
  errorMessage = '';
  loading = true;
  groupsLoading = true;  // ← separate spinner for groups

  allGroups: any[] = [];
  selectedGroupIds: string[] = [];

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
    private groupsService: GroupsService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.contactId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.contactId) {
      this.errorMessage = 'No contact ID provided';
      this.loading = false;
      this.groupsLoading = false;
      return;
    }
    // ✅ Load BOTH at the same time - no waiting
    this.loadGroups();
    this.loadContact();
  }

  // ==========================================
  // LOAD GROUPS
  // ==========================================
  loadGroups(): void {
    this.groupsLoading = true;
    this.groupsService.getGroups().subscribe({
      next: (res) => {
        this.allGroups = res.groups || [];
        this.groupsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.groupsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // LOAD CONTACT
  // ==========================================
  loadContact(): void {
    this.loading = true;
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
        // ✅ Load existing group assignments
        if (response.groups && response.groups.length > 0) {
          this.selectedGroupIds = response.groups.map((g: any) =>
            typeof g === 'object' ? g._id : g
          );
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = `Failed to load contact: ${error.status}`;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // GROUP HELPERS
  // ==========================================
  isGroupSelected(groupId: string): boolean {
    return this.selectedGroupIds.includes(groupId);
  }

  toggleGroup(groupId: string): void {
    if (this.selectedGroupIds.includes(groupId)) {
      this.selectedGroupIds = this.selectedGroupIds.filter(id => id !== groupId);
    } else {
      this.selectedGroupIds = [...this.selectedGroupIds, groupId];
    }
  }

  getGroupName(groupId: string): string {
    const group = this.allGroups.find(g => g._id === groupId);
    return group ? group.name : '';
  }

  getGroupColor(groupId: string): string {
    const group = this.allGroups.find(g => g._id === groupId);
    return group ? group.color : '#6b7280';
  }

  // ==========================================
  // SAVE CONTACT
  // ==========================================
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
      },
      groups: this.selectedGroupIds  // ✅ save groups
    };

    this.contactsService.updateContact(this.contactId, payload).subscribe({
      next: () => {
        this.showToast('Contact updated successfully!', 'success');
        window.dispatchEvent(new CustomEvent('contacts-updated'));
        setTimeout(() => this.router.navigate(['/contacts']), 1000);
      },
      error: (error: any) => {
        this.showToast('Failed to update: ' + error.message, 'error');
      }
    });
  }

  // ==========================================
  // CANCEL
  // ==========================================
  cancel(): void {
    this.router.navigate(['/contacts']);
  }

  // ==========================================
  // TOAST
  // ==========================================
  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
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
