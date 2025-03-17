import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  model,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

/**
 * @title Dialog with header, potentially scrollable content and actions
 */

@Component({
  selector: 'app-real-person-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: './real-person-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealPersonDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { continued: boolean }) {}

  readonly email = model('');
}
