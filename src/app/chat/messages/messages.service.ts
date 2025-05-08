import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { Messages, Message } from './messages.model';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  http = inject(HttpClient);
  private readonly STORAGE_KEY = 'chat_messages';
  private readonly CONVERSATION_ID_KEY = 'current_conversation_id';

  // Initialize messages from localStorage
  public messages = signal<Messages>(this.loadMessagesFromStorage());

  // Track the conversation ID
  private conversationId: string | null = localStorage.getItem(
    this.CONVERSATION_ID_KEY
  );

  constructor() {
    // Save messages to localStorage whenever they change
    effect(() => {
      this.saveMessagesToStorage(this.messages());
    });
  }

  // Load messages from localStorage
  private loadMessagesFromStorage(): Messages {
    const storedMessages = localStorage.getItem(this.STORAGE_KEY);
    if (storedMessages) {
      try {
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

  // Method to set language preference without displaying in the chat
  setLanguagePreference(instruction: string) {
    // Prepare the request payload with conversation ID if available
    const payload: any = { message: instruction };
    if (this.conversationId) {
      payload.conversation_id = this.conversationId;
    }

    this.http
      .post<{ message: string; conversation_id: string }>(
        `http://localhost:5000/api/chat`,
        payload
      )
      .subscribe({
        next: (response) => {
          // Store the conversation ID if we didn't have one
          if (!this.conversationId && response.conversation_id) {
            this.conversationId = response.conversation_id;
            localStorage.setItem(
              this.CONVERSATION_ID_KEY,
              response.conversation_id
            );
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
            localStorage.setItem(
              this.CONVERSATION_ID_KEY,
              response.conversation_id
            );
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
          `http://localhost:5000/api/conversations/${this.conversationId}`
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
              this.saveMessagesToStorage(formattedMessages);
            }
          },
          error: (error) => {
            console.error('Error syncing with server:', error);
            // If there's an error, we'll still have the local messages
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
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CONVERSATION_ID_KEY);
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
            console.log('Conversation saved to Trello:', response); // Possible to add a client-side message here
          },
          error: (error) => {
            console.error('Error saving conversation to Trello:', error);
          },
        });
    }
  }
}
