import { Injectable } from '@angular/core';
import { Messages } from './messages.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor() {}

  private messages: Messages = [
    {
      id: 1,
      from: 'user',
      content: 'Hello, Can you help me with my order?',
      timestamp: new Date(),
    },
    {
      id: 2,
      from: 'bot',
      content: 'sure, I can help you with that. What seems to be the problem?',
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
        'What do if text is too long for one line lelelelele? What do if text is too long for one line? What do if text is too long for one line? What do if text is too long for one line?',
      timestamp: new Date(),
    },
  ];

  getMessages(): Messages {
    return this.messages;
  }
}
