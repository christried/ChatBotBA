import { Component, inject, ViewChild } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormsModule,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessagesService } from '../messages/messages.service';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
  selector: 'app-input',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    TextFieldModule,
  ],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css'],
})
export class InputComponent {
  private messagesService = inject(MessagesService);

  form = new FormGroup({
    message: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  handleKeyDown(event: KeyboardEvent): void {
    // Check if Enter was pressed without Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      // Prevent the default action (newline)
      event.preventDefault();

      // Submit the form if it's valid
      if (this.form.valid && this.form.value.message?.trim()) {
        this.onSubmit();
      }
    }
    // If Shift+Enter is pressed, the default behavior (newline) will happen
  }

  onSubmit() {
    if (this.form.invalid || !this.form.value.message?.trim()) {
      console.log('invalid form or empty message!');
      return;
    }

    const messageContent = this.form.value.message as string;
    this.messagesService.addMessage(messageContent);

    console.log('INPUT: Nachricht verschickt:' + this.form.value.message);
    this.form.reset();
  }
}
