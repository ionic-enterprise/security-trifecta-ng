import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SessionVaultService, SyncService } from '@app/core';
import { IonicModule, NavController } from '@ionic/angular';
import { LoginCardComponent } from './login-card/login-card.component';
import { UnlockCardComponent } from './unlock-card/unlock-card.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, LoginCardComponent, UnlockCardComponent],
})
export class LoginPage implements OnInit {
  showUnlock: boolean;
  syncing = false;

  constructor(
    private navController: NavController,
    private sessionVault: SessionVaultService,
    private sync: SyncService
  ) {}

  async ngOnInit() {
    this.showUnlock = await this.sessionVault.sessionIsLocked();
  }

  async onLoginSuccess(): Promise<void> {
    this.syncing = true;
    await this.sync.execute();
    this.navController.navigateRoot(['/', 'tasting-notes']);
    this.syncing = false;
  }

  onUnlock(): void {
    this.navController.navigateRoot(['/', 'tasting-notes']);
  }

  onVaultClear(): void {
    this.showUnlock = false;
  }
}
