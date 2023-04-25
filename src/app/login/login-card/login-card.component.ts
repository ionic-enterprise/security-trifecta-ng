import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, SessionVaultService } from '@app/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login-card',
  templateUrl: './login-card.component.html',
  styleUrls: ['./login-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class LoginCardComponent {
  @Output() loginSuccess = new EventEmitter<void>();

  email: string;
  password: string;
  errorMessage: string;

  constructor(private authentication: AuthenticationService, private sessionVault: SessionVaultService) {}

  async signIn() {
    try {
      await this.authentication.login();
      await this.sessionVault.initializeUnlockMode();
      this.loginSuccess.emit();
    } catch (err) {
      this.errorMessage = 'Invalid email or password';
    }
  }
}
