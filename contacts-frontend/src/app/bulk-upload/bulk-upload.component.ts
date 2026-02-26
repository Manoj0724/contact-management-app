// =====================================================================================
// FILE: src/app/bulk-upload/bulk-upload.component.ts
// =====================================================================================
import { Component, NgZone, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ContactRow {
  title: string;
  firstName: string;
  lastName: string;
  mobile1: string;
  mobile2: string;
  city: string;
  state: string;
  pincode: string;
  _rowError?: string;
}

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,

  ],
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.css']
})
export class BulkUploadComponent {

  // Step control: 'upload' | 'preview' | 'result'
  step: 'upload' | 'preview' | 'result' = 'upload';

  // Drag state
  isDragging = false;

  // File info
  fileName = '';
  parseError = '';

  // Parsed rows for preview/edit
  parsedContacts: ContactRow[] = [];

  // Upload result
  uploadResult: any = null;
  uploading = false;

  // Titles for dropdown in manual table
  titles = ['Mr', 'Mrs', 'Ms', 'Dr'];

  // Manual add mode
  showManualTable = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    // Start with 5 blank rows for manual entry
    this.initManualRows();
  }

  // ==========================================
  // MANUAL TABLE - blank rows
  // ==========================================
  initManualRows(): void {
    this.parsedContacts = Array.from({ length: 5 }, () => ({
      title: '', firstName: '', lastName: '',
      mobile1: '', mobile2: '', city: '', state: '', pincode: ''
    }));
  }

  addRow(): void {
    this.parsedContacts.push({
      title: '', firstName: '', lastName: '',
      mobile1: '', mobile2: '', city: '', state: '', pincode: ''
    });
  }

  removeRow(index: number): void {
    this.parsedContacts.splice(index, 1);
    if (this.parsedContacts.length === 0) this.addRow();
  }

  useManualEntry(): void {
    this.showManualTable = true;
    this.step = 'preview';
    this.fileName = 'Manual Entry';
    this.parseError = '';
  }

  // ==========================================
  // DRAG & DROP
  // ==========================================
  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging = true; }
  onDragLeave(e: DragEvent): void { this.isDragging = false; }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelect(e: any): void {
    const file = e.target.files[0];
    if (file) this.processFile(file);
    e.target.value = '';
  }

  // ==========================================
  // PROCESS CSV
  // ==========================================
 processFile(file: File): void {
  console.log('📂 Processing file:', file.name, file.size, 'bytes');
  this.parseError = '';

  if (!file.name.endsWith('.csv')) {
    this.parseError = 'Only CSV files are supported (.csv)';
    console.log('❌ Wrong file type');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    this.parseError = 'File too large. Max 5MB allowed.';
    console.log('❌ File too large');
    return;
  }

  this.fileName = file.name;
  const reader = new FileReader();

  reader.onload = (e) => {
    console.log('📄 File loaded, parsing...');
    this.zone.run(() => {
      const text = e.target?.result as string;
      console.log('📝 CSV content:', text.substring(0, 100));
      this.parseCSV(text);
    });
  };

  reader.onerror = (e) => {
    console.error('❌ File read error:', e);
    this.parseError = 'Failed to read file';
  };

  reader.readAsText(file);
}

  parseCSV(text: string): void {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      this.parseError = 'CSV must have a header row + at least one data row.';
      return;
    }

    const headers = lines[0].split(',').map(h =>
      h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, '')
    );

    const alias: Record<string, string> = {
      'title': 'title', 'salutation': 'title',
      'firstname': 'firstName', 'first_name': 'firstName',
      'lastname': 'lastName', 'last_name': 'lastName',
      'mobile1': 'mobile1', 'mobile': 'mobile1', 'phone': 'mobile1',
      'mobile2': 'mobile2', 'alternate': 'mobile2',
      'city': 'city', 'state': 'state',
      'pincode': 'pincode', 'pin': 'pincode', 'zip': 'pincode'
    };

    const mapped = headers.map(h => alias[h] || h);
    const required = ['title', 'firstName', 'lastName', 'mobile1', 'city', 'state', 'pincode'];
    const missing = required.filter(r => !mapped.includes(r));

    if (missing.length > 0) {
      this.parseError = `Missing columns: ${missing.join(', ')}. Please use the template.`;
      return;
    }

    const contacts: ContactRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = this.parseCSVLine(lines[i]);
      const row: any = {};
      mapped.forEach((h, idx) => { row[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim(); });
      contacts.push(row);
    }

    if (contacts.length > 500) {
      this.parseError = 'Max 500 contacts per upload. Split your file.';
      return;
    }

    this.parsedContacts = contacts;
    this.showManualTable = false;
    this.step = 'preview';
  }

  parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
      else cur += ch;
    }
    result.push(cur);
    return result;
  }

  // ==========================================
  // UPLOAD
  // ==========================================
     uploadContacts(): void {
  const toUpload = this.parsedContacts.filter(c =>
    c.firstName || c.lastName || c.mobile1
  );

  if (toUpload.length === 0) {
    this.snackBar.open('Please add at least one contact', '✕', { duration: 3000 });
    return;
  }

  this.uploading = true;
  this.cdr.detectChanges(); // ✅ Force update

  this.http.post<any>('/api/contacts/bulk-upload', { contacts: toUpload })
    .subscribe({
      next: (result) => {
        this.uploadResult = result;
        this.step = 'result';
        this.uploading = false;
        this.cdr.detectChanges(); // ✅ Force update
        window.dispatchEvent(new CustomEvent('contacts-updated'));
      },
      error: (err) => {
        this.uploading = false;
        this.cdr.detectChanges(); // ✅ Force update
        this.snackBar.open(
          err.error?.message || 'Upload failed. Try again.',
          '✕',
          { duration: 4000, panelClass: ['toast-error'] }
        );
      }
    });
}
  // ==========================================
  // DOWNLOAD TEMPLATE
  // ==========================================
  downloadTemplate(): void {
    const csv = [
      'title,firstName,lastName,mobile1,mobile2,city,state,pincode',
      'Mr,John,Smith,9876543210,9876543211,Mumbai,Maharashtra,400001',
      'Mrs,Priya,Sharma,8765432109,,Delhi,Delhi,110001',
      'Dr,Arjun,Patel,7654321098,7654321099,Bangalore,Karnataka,560001',
      'Ms,Sneha,Iyer,6543210987,,Chennai,Tamil Nadu,600001'
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);

    this.snackBar.open('✅ Template downloaded!', '✕', { duration: 2500, panelClass: ['toast-success'] });
  }

  // ==========================================
  // NAVIGATION
  // ==========================================
  reset(): void {
    this.step = 'upload';
    this.parsedContacts = [];
    this.fileName = '';
    this.parseError = '';
    this.uploadResult = null;
    this.showManualTable = false;
    this.initManualRows();
  }

  goToContacts(): void {
    this.router.navigate(['/contacts']);
  }

  // ==========================================
  // HELPERS
  // ==========================================
  getSuccessRate(): number {
    if (!this.uploadResult || this.uploadResult.total === 0) return 0;
    return Math.round((this.uploadResult.uploaded / this.uploadResult.total) * 100);
  }

  get validRowCount(): number {
    return this.parsedContacts.filter(c => c.firstName || c.mobile1).length;
  }
  // ==========================================
// ✅ ADD THESE PROPERTIES (after step declaration)
// ==========================================
showTemplatePreview = false;

// CSV Template data
readonly CSV_TEMPLATE_HEADERS = [
  'title', 'firstName', 'lastName', 'mobile1',
  'mobile2', 'city', 'state', 'pincode'
];

readonly CSV_SAMPLE_ROWS = [
  ['Mr', 'John', 'Smith', '9876543210', '9876543211', 'Mumbai', 'Maharashtra', '400001'],
  ['Mrs', 'Priya', 'Sharma', '8765432109', '', 'Delhi', 'Delhi', '110001'],
  ['Dr', 'Arjun', 'Patel', '7654321098', '7654321099', 'Bangalore', 'Karnataka', '560001'],
  ['Ms', 'Sneha', 'Iyer', '6543210987', '', 'Chennai', 'Tamil Nadu', '600001']
];

readonly VALIDATION_RULES = [
  { field: 'title', rule: 'Must be: Mr, Mrs, Ms, or Dr', example: 'Mr', required: true },
  { field: 'firstName', rule: 'Letters and spaces only', example: 'John', required: true },
  { field: 'lastName', rule: 'Letters and spaces only', example: 'Smith', required: true },
  { field: 'mobile1', rule: 'Exactly 10 digits', example: '9876543210', required: true },
  { field: 'mobile2', rule: 'Exactly 10 digits (optional)', example: '9876543211', required: false },
  { field: 'city', rule: 'Letters only', example: 'Mumbai', required: true },
  { field: 'state', rule: 'Letters only', example: 'Maharashtra', required: true },
  { field: 'pincode', rule: 'Exactly 6 digits', example: '400001', required: true }
];

// ==========================================
// ✅ ADD THIS METHOD (after downloadTemplate)
// ==========================================
toggleTemplatePreview(): void {
  this.showTemplatePreview = !this.showTemplatePreview;
}
}
