import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './group-dialog.component.html',
  styleUrls: ['./group-dialog.component.css'],
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-container {
      border-radius: 16px !important;
      padding: 0 !important;
      overflow: hidden;
    }
  `]
})
export class GroupDialogComponent {

  // Edit mode or create mode
  isEditMode = false;
  groupName = '';
  selectedColor = '#3B82F6';
  selectedIcon = 'label';

  colors = [
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Gray', hex: '#6B7280' },
    { name: 'Pink', hex: '#EC4899' }
  ];

  icons = [
    'work', 'family_restroom', 'group', 'business',
    'school', 'sports_soccer', 'restaurant', 'local_hospital',
    'star', 'favorite', 'home', 'phone'
  ];

  constructor(
    public dialogRef: MatDialogRef<GroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // If editing existing group
    if (data && data.group) {
      this.isEditMode = true;
      this.groupName = data.group.name;
      this.selectedColor = data.group.color;
      this.selectedIcon = data.group.icon || 'label';
    }
  }

  onSubmit(): void {
    if (this.groupName.trim()) {
      this.dialogRef.close({
        name: this.groupName.trim(),
        color: this.selectedColor,
        icon: this.selectedIcon
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
