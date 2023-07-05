import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionVaultService } from '@app/core';
import { VaultType } from '@ionic-enterprise/identity-vault';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-unlock-card',
  templateUrl: './unlock-card.component.html',
  styleUrls: ['./unlock-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class UnlockCardComponent implements OnInit {
  @Output() unlock = new EventEmitter<void>();
  @Output() vaultClear = new EventEmitter<void>();

  errorMessage: string;
  vaultType: VaultType;

  constructor(private sessionVault: SessionVaultService) {}

  async ngOnInit() {
    this.vaultType = await this.sessionVault.getType();
    setTimeout(async () => {
      this.vaultType = await this.sessionVault.getType();
    }, 3000);
  }

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
