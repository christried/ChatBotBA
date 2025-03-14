import { Component, inject, effect } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

import { MessagesService } from './messages.service';
import { Messages } from './messages.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [MatCardModule, MatListModule, MatIconModule, NgClass],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessagesComponent {
  messages: Messages = [];
  private messagesService = inject(MessagesService);

  constructor() {
    effect(() => {
      this.messages = this.messagesService.messages();
    });
  }
}
