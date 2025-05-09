import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

import { ChatComponent } from './chat/chat.component';
import { MenuComponent } from './menu/menu.component';
import { HealthService } from './health.service';
import { MessagesService } from './chat/messages/messages.service';

@Component({
  selector: 'app-root',
  imports: [ChatComponent, MenuComponent, MatCardModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  backendStatus: boolean = false;
  title = 'app';
  healthService = inject(HealthService);
  messagesService = inject(MessagesService);

  ngOnInit(): void {
    this.checkApiHealth();
  }

  checkApiHealth() {
    this.healthService.checkHealth().subscribe({
      next: (isHealthy) => {
        this.backendStatus = isHealthy;
        if (this.backendStatus) {
          console.log('Backend is running!');
          // Deleted LocalStorage functionality here, may revisit later
          // The conversation ID is now only stored in memory during the session
        }
      },
      error: (err) => {
        console.error('Error checking health:', err);
        this.backendStatus = false;
      },
    });
  }
}
