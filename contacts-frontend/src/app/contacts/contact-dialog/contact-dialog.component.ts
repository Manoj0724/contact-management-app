import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">

      <!-- HEADER -->
      <div class="confirm-header"
           [ngClass]="{
             'danger': data.type === 'danger',
             'warning': data.type === 'warning',
             'info': data.type === 'info'
           }">
        <mat-icon class="confirm-icon">
          {{ data.type === 'danger' ? 'delete_forever' :
             data.type === 'warning' ? 'warning_amber' : 'info' }}
        </mat-icon>
        <h2>{{ data.title }}</h2>
      </div>

      <!-- BODY -->
      <div class="confirm-body">
        <p>{{ data.message }}</p>
      </div>

      <!-- FOOTER -->
      <div class="confirm-footer">
        <button mat-stroked-button
                (click)="onCancel()">
          <mat-icon>close</mat-icon>
          {{ data.cancelText }}
        </button>
        <button mat-raised-button
                [color]="data.type === 'danger' ? 'warn' : 'primary'"
                (click)="onConfirm()">
          <mat-icon>
            {{ data.type === 'danger' ? 'delete' : 'check' }}
          </mat-icon>
          {{ data.confirmText }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .confirm-dialog {
      border-radius: 16px;
      overflow: hidden;
      min-width: 400px;
    }

    .confirm-header {
      padding: 28px 28px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .confirm-header.danger {
      background: linear-gradient(135deg, #b71c1c, #c62828);
    }

    .confirm-header.warning {
      background: linear-gradient(135deg, #e65100, #ef6c00);
    }

    .confirm-header.info {
      background: linear-gradient(135deg, #1a237e, #283593);
    }

    .confirm-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: white;
    }

    .confirm-header h2 {
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }

    .confirm-body {
      padding: 24px 28px;
      text-align: center;
    }

    .confirm-body p {
      font-size: 15px;
      color: #374151;
      margin: 0;
      line-height: 1.6;
    }

    .confirm-footer {
      padding: 16px 28px 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
