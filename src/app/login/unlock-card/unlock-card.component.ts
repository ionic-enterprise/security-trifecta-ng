import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionVaultService } from '@app/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-unlock-card',
  templateUrl: './unlock-card.component.html',
  styleUrls: ['./unlock-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class UnlockCardComponent {
  @Output() unlock = new EventEmitter<void>();
  @Output() vaultClear = new EventEmitter<void>();

  errorMessage: string;

  constructor(private sessionVault: SessionVaultService) {}

  async redoClicked() {
    await this.sessionVault.clearSession();
    this.vaultClear.emit();
  }

  async unlockClicked() {
    try {
      await this.sessionVault.getSession();
      this.unlock.emit();
    } catch (err) {
      this.errorMessage = 'Unlock failed';
    }
  }
}
