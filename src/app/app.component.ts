import { Component } from '@angular/core';
import { ChatComponent } from './chat/chat.component';
import { MenuComponent } from './menu/menu.component';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-root',
  imports: [ChatComponent, MenuComponent, MatCardModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'app';
}
