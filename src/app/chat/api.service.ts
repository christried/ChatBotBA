import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Send a message to the chat API and return the response
  sendMessage(message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/chat`, { message });
  }
}
