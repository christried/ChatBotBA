import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private apiUrl = environment.apiUrl;
  private sessionId = 'default'; // Could be user-specific

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/chat`, {
      message,
      sessionId: this.sessionId,
    });
  }

  getChatHistory(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/api/chat/history?sessionId=${this.sessionId}`
    );
  }

  resetChat(): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/chat/reset`, {
      sessionId: this.sessionId,
    });
  }

  sendFeedback(feedback: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/feedback`, {
      feedback,
      email,
      sessionId: this.sessionId,
    });
  }
}
