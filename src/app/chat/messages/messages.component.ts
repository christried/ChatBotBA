import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { MessagesService } from './messages.service';

@Component({
  selector: 'app-messages',
  imports: [MatCardModule, MatListModule, MatIconModule, NgClass],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css',
})
export class MessagesComponent {
  messagesService = inject(MessagesService);
  public messages = this.messagesService.getMessages();
}
