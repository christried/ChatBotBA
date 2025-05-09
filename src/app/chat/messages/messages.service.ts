import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { Messages, Message } from './messages.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  http = inject(HttpClient);

  // Initialize messages as an empty array
  public messages = signal<Messages>([]);

  // Track the conversation ID
  private conversationId: string | null = null;

  constructor() {
    // Deleted LocalStorage functionality, may revisit later
  }

  // Method to set language preference without displaying in the chat
  setLanguagePreference(instruction: string) {
    // Prepare the request payload with conversation ID if available
    const payload: any = { message: instruction };
    if (this.conversationId) {
      payload.conversation_id = this.conversationId;
    }

    this.http
      .post<{ message: string; conversation_id: string }>(
        `${environment.apiUrl}/api/chat`,
        payload
      )
      .subscribe({
        next: (response) => {
          // Store the conversation ID if we didn't have one
          if (!this.conversationId && response.conversation_id) {
            this.conversationId = response.conversation_id;
          }
          console.log('Language preference updated');

          // Add a bot response to confirm the language change
          const botAnswer: Message = {
            id: this.messages().length + 1,
            from: 'bot',
            content: response.message,
            timestamp: new Date(),
          };

          this.messages.update((messages) => [...messages, botAnswer]);
        },
        error: (error) => {
          console.error('Error setting language preference:', error);
        },
      });
  }

  // Method to add a new user message
  addMessage(content: string, finalizeIfNew = true) {
    // If we don't have a conversation ID yet, this is a new conversation
    const isNewConversation = !this.conversationId;

    const newMessage: Message = {
      id: this.messages().length + 1,
      from: 'user',
      content: content,
      timestamp: new Date(),
    };

    this.messages.update((messages) => [...messages, newMessage]);

    // When starting a new conversation, add a flag to finalize the previous one
    this.addAnswer(content, isNewConversation && finalizeIfNew);
  }

  // Method to add a new bot answer
  addAnswer(content: string, finalizePrevious = false) {
    // Prepare the request payload
    const payload: any = {
      message: content,
      finalize_previous: finalizePrevious,
    };

    if (this.conversationId) {
      payload.conversation_id = this.conversationId;
    }

    this.http
      .post<{ message: string; conversation_id: string }>(
        `${environment.apiUrl}/api/chat`,
        payload
      )
      .subscribe({
        next: (response) => {
          // Store the conversation ID if we didn't have one
          if (!this.conversationId && response.conversation_id) {
            this.conversationId = response.conversation_id;
          }

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

  // Method to sync messages with the server on application load
  syncMessagesWithServer() {
    if (this.conversationId) {
      this.http
        .get<any[]>(
          `${environment.apiUrl}/api/conversations/${this.conversationId}`
        )
        .subscribe({
          next: (response) => {
            // If the conversation exists on the server, use those messages
            if (response && response.length > 0) {
              const formattedMessages: Messages = response.map((msg) => ({
                id: msg.id,
                from: msg.role === 'user' ? 'user' : 'bot',
                content: msg.content,
                timestamp: new Date(msg.timestamp),
              }));

              this.messages.set(formattedMessages);
            }
          },
          error: (error) => {
            console.error('Error syncing with server:', error);
            // If there's an error, keep the empty messages array
          },
        });
    }
  }

  // Method to clear all messages
  resetMessages() {
    // Finalize the current conversation if one exists
    if (this.conversationId) {
      this.finalizeConversation();
    }

    // Reset conversation state
    this.messages.set([]);
    this.conversationId = null;
    console.log('SERVICE: Nachrichten zurückgesetzt');
  }

  // Method to finalize the current conversation and save it to Trello
  finalizeConversation() {
    if (this.conversationId) {
      this.http
        .post<any>(
          `${environment.apiUrl}/api/conversations/${this.conversationId}/finalize`,
          {}
        )
        .subscribe({
          next: (response) => {
            console.log('Conversation saved to Trello:', response);
          },
          error: (error) => {
            console.error('Error saving conversation to Trello:', error);
          },
        });
    }
  }
}
