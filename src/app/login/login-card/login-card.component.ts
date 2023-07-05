import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, SessionVaultService } from '@app/core';
import { VaultType } from '@ionic-enterprise/identity-vault';
import { IonicModule, Platform } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-login-card',
  templateUrl: './login-card.component.html',
  styleUrls: ['./login-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class LoginCardComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();

  authenticating = false;
  showSessionLocking: boolean;
  useSessionLocking: boolean;
  errorMessage: string;
  vaultType: VaultType;

  constructor(
    platform: Platform,
    private authentication: AuthenticationService,
    private sessionVault: SessionVaultService
  ) {
    this.showSessionLocking = platform.is('hybrid');
  }

  async ngOnInit() {
    this.vaultType = await this.sessionVault.getType();
    const { value } = await Preferences.get({ key: 'new-install' });
    if (!value) {
      await Preferences.set({ key: 'new-install', value: 'true' });
      await this.sessionVault.resetUnlockMode();
      this.vaultType = await this.sessionVault.getType();
    }
  }

  async signIn() {
    try {
      this.authenticating = true;
      await this.sessionVault.disableLocking();
      await this.authentication.login();
      this.loginSuccess.emit();
    } catch (err) {
      this.errorMessage = 'Invalid email or password';
    } finally {
      this.authenticating = false;
      await this.sessionVault.enableLocking();
    }
  }

  async useSessionLockingChanged() {
    if (this.useSessionLocking) {
      await this.sessionVault.initializeUnlockMode();
    } else {
      await this.sessionVault.resetUnlockMode();
    }
    this.vaultType = await this.sessionVault.getType();
  }
}
