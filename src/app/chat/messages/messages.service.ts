import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Messages, Message } from './messages.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  http = inject(HttpClient);
  private readonly STORAGE_KEY = 'chat_messages';

  // Initialize messages from localStorage if available
  public messages = signal<Messages>(this.loadMessagesFromStorage());

  constructor() {
    // Use effect to save messages to localStorage whenever they change
    effect(() => {
      this.saveMessagesToStorage(this.messages());
    });
  }

  // Load messages from localStorage
  private loadMessagesFromStorage(): Messages {
    const storedMessages = localStorage.getItem(this.STORAGE_KEY);
    if (storedMessages) {
      try {
        // Parse the stored JSON and convert timestamp strings back to Date objects
        const parsedMessages = JSON.parse(storedMessages);
        return parsedMessages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp),
        }));
      } catch (error) {
        console.error('Error parsing stored messages:', error);
        return [];
      }
    }
    return [];
  }

  // Save messages to localStorage
  private saveMessagesToStorage(messages: Messages): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }

  // Method to add a new user message
  addMessage(content: string) {
    const newMessage: Message = {
      id: this.messages().length + 1,
      from: 'user',
      content: content,
      timestamp: new Date(),
    };
    this.messages.update((messages) => [...messages, newMessage]);

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

          // Add an error message to the chat
          const errorMessage: Message = {
            id: this.messages().length + 1,
            from: 'bot',
            content:
              'Sorry, I encountered an error processing your request. Please try again later.',
            timestamp: new Date(),
          };
          this.messages.update((messages) => [...messages, errorMessage]);
        },
      });
  }

  // Method to clear all messages (also clears localStorage)
  resetMessages() {
    this.messages.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('SERVICE: Nachrichten zurückgesetzt');
  }
}
