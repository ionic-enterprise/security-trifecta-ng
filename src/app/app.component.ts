import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { PreferencesService, SessionVaultService } from './core';
import { Device } from '@ionic-enterprise/identity-vault';
import { SplashScreen } from '@capacitor/splash-screen';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class AppComponent implements OnInit {
  constructor(
    private navController: NavController,
    private preferences: PreferencesService,
    private sessionVault: SessionVaultService
  ) {}

  async ngOnInit() {
    this.handlePreferencesChange();
    this.handleLocked();
    Device.setHideScreenOnBackground(true);
    SplashScreen.hide();
  }

  private handlePreferencesChange() {
    this.preferences.preferencesChanged$.subscribe(() => {
      document.body.classList.toggle('dark', this.preferences.prefersDarkMode);
    });
  }

  private async handleLocked() {
    this.sessionVault.locked$.subscribe((locked) => {
      if (locked) {
        this.navController.navigateRoot(['/', 'login']);
      }
    });
  }
}
