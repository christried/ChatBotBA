import { Injectable, signal } from '@angular/core';
import { Messages, Message } from './messages.model';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  public messages = signal<Messages>([
    {
      id: 1,
      from: 'user',
      content: 'Hello, Can you help me with my order?',
      timestamp: new Date(),
    },
    {
      id: 2,
      from: 'bot',
      content: 'Sure, I can help you with that. What seems to be the problem?',
      timestamp: new Date(),
    },
    {
      id: 3,
      from: 'user',
      content: 'I have not received my order yet.',
      timestamp: new Date(),
    },
    {
      id: 4,
      from: 'bot',
      content:
        'What do if text is too long for one lineeeeeeeeeeeeee? What do if text is too long for one line? What do if text is too long for one line? What do if text is too long for one line?',
      timestamp: new Date(),
    },
  ]);

  addMessage(content: string) {
    const newMessage: Message = {
      id: this.messages().length + 1,
      from: 'user',
      content,
      timestamp: new Date(),
    };
    this.messages.update((messages) => [...messages, newMessage]);
    console.log('SERVICE: Nachricht hinzugefügt:' + this.messages());
    setTimeout(() => {
      this.addAnswer('This is an automated reply.');
    }, 2000);
  }

  addAnswer(content: string) {
    const newMessage: Message = {
      id: this.messages().length + 1,
      from: 'bot',
      content,
      timestamp: new Date(),
    };
    this.messages.update((messages) => [...messages, newMessage]);
    console.log('SERVICE: Antwort hinzugefügt:' + this.messages());
  }
}
