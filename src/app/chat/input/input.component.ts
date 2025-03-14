import { Component, inject } from '@angular/core';
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

@Component({
  selector: 'app-input',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
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

  onSubmit() {
    if (this.form.invalid) {
      console.log('invalid form!');
      return;
    }

    const messageContent = this.form.value.message as string;
    this.messagesService.addMessage(messageContent);

    console.log('INPUT: Nachricht verschickt:' + this.form.value.message);
    this.form.reset();
  }
}
