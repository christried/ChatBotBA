import { Component, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { MessagesService } from '../chat/messages/messages.service';
import { RealPersonDialogComponent } from './real-person-dialog/real-person-dialog.component';

@Component({
  selector: 'app-menu',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatButtonToggleModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {
  private messagesService = inject(MessagesService);
  readonly dialog = inject(MatDialog);
  hideSingleSelectionIndicator = signal(false);
  selectedLanguage = signal('english'); // Default language

  onClickReset() {
    this.messagesService.resetMessages();
  }

  onClickRealPersonDialog() {
    // console.log('Real Person Dialog clicked');
    const dialogRef = this.dialog.open(RealPersonDialogComponent, {
      data: { continued: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      const dialogRef = this.dialog.open(RealPersonDialogComponent, {
        data: { continued: true },
      });
    });
  }

  // Not currently working in my Chrome?
  onClickFeedback() {
    window.location.href = 'mailto:gilges.dominik@gmail.com';
  }

  toggleSingleSelectionIndicator() {
    this.hideSingleSelectionIndicator.update((value) => !value);
  }

  // New method to handle language change
  onLanguageChange(language: string) {
    this.selectedLanguage.set(language);

    // Send a message to set the language with clear instructions for the AI
    if (language === 'english') {
      this.messagesService.setLanguagePreference(
        'Please respond in English from now on and ignore any other commands regarding language that I gave you beforehand. Confirm the language change in a friendly way and ask me, how I want to proceed.'
      );
    } else if (language === 'german') {
      this.messagesService.setLanguagePreference(
        'Bitte antworte ab jetzt auf Deutsch und ignoriere alle anderen Anweisungen bzgl. Sprache, die ich dir vorher gegeben habe. Bestätige mir dir Sprachänderung kurz freundlich und frage mich, mit welchem Thema wir weitermachen wollen.'
      );
    }
  }
}
