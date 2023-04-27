import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, SessionVaultService } from '@app/core';
import { IonicModule, Platform } from '@ionic/angular';

@Component({
  selector: 'app-login-card',
  templateUrl: './login-card.component.html',
  styleUrls: ['./login-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class LoginCardComponent {
  @Output() loginSuccess = new EventEmitter<void>();

  authenticating = false;
  showSessionLocking: boolean;
  useSessionLocking: boolean;
  errorMessage: string;

  constructor(
    platform: Platform,
    private authentication: AuthenticationService,
    private sessionVault: SessionVaultService
  ) {
    this.showSessionLocking = platform.is('hybrid');
  }

  async signIn() {
    try {
      this.authenticating = true;
      await this.authentication.login();
      this.loginSuccess.emit();
      this.authenticating = false;
    } catch (err) {
      this.errorMessage = 'Invalid email or password';
    }
  }

  async useSessionLockingChanged() {
    if (this.useSessionLocking) {
      await this.sessionVault.initializeUnlockMode();
    } else {
      await this.sessionVault.resetUnlockMode();
    }
  }
}
