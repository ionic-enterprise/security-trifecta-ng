import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
export class LoginCardComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();

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

  async ngOnInit() {
    await this.sessionVault.resetUnlockMode();
  }

  async signIn() {
    try {
      await this.authentication.login();
      this.loginSuccess.emit();
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
