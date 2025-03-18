import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Messages, Message } from './messages.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  http = inject(HttpClient);

  public messages = signal<Messages>([]);

  // Method to add a new user message
  addMessage(content: string) {
    const newMessage: Message = {
      id: this.messages().length + 1,
      from: 'user',
      content: content,
      timestamp: new Date(),
    };
    this.messages.update((messages) => [...messages, newMessage]);
    // console.log('SERVICE: Nachricht hinzugefügt:' + this.messages());

    this.addAnswer(content);
  }

  // Method to add a new bot answer
  addAnswer(content: string) {
    this.http
      .post<{ message: string }>('http://localhost:5000/api/chat', {
        message: content,
      })
      .subscribe({
        next: (response) => {
          const botAnswer: Message = {
            id: this.messages().length + 1,
            from: 'bot',
            content: response.message,
            timestamp: new Date(),
          };
          this.messages.update((messages) => [...messages, botAnswer]);
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }

  // Method to clear all messages
  resetMessages() {
    this.messages.set([]);
    console.log('SERVICE: Nachrichten zurückgesetzt:' + this.messages());
  }
}
