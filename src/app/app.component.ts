import { Component } from '@angular/core';
import { ChatComponent } from './chat/chat.component';
import { MenuComponent } from './chat/menu/menu.component';

@Component({
  selector: 'app-root',
  imports: [ChatComponent, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'app';
}
