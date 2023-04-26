import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AuthenticationService,
  PreferencesService,
  SessionVaultService,
  SyncService,
  TastingNotesService,
  TeaCategoriesService,
} from '@app/core';
import { TastingNote } from '@app/models';
import { TastingNoteEditorComponent } from '@app/tasting-note-editor/tasting-note-editor.component';
import {
  IonicModule,
  IonRouterOutlet,
  ModalController,
  ModalOptions,
  NavController,
  ToastController,
} from '@ionic/angular';

@Component({
  selector: 'app-tasting-notes',
  templateUrl: 'tasting-notes.page.html',
  styleUrls: ['tasting-notes.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TastingNoteEditorComponent],
})
export class TastingNotesPage implements OnInit {
  notes: Array<TastingNote> = [];
  prefersDarkMode: boolean;

  constructor(
    private authentication: AuthenticationService,
    private navController: NavController,
    private modalController: ModalController,
    private preferences: PreferencesService,
    private routerOutlet: IonRouterOutlet,
    private sessionVault: SessionVaultService,
    private sync: SyncService,
    private toastController: ToastController,
    private tastingNotes: TastingNotesService,
    private teaCategories: TeaCategoriesService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.preferences.load();
    this.prefersDarkMode = this.preferences.prefersDarkMode;
    this.teaCategories.refresh();
    await this.tastingNotes.refresh();
    this.notes = [...this.tastingNotes.data];
  }

  async logout(): Promise<void> {
    await this.authentication.logout();
    await this.sessionVault.clearSession();
    this.navController.navigateRoot(['/', 'login']);
  }

  async presentNoteEditor(note?: TastingNote): Promise<void> {
    let opt: ModalOptions = {
      component: TastingNoteEditorComponent,
      backdropDismiss: false,
      presentingElement: this.routerOutlet.nativeEl,
    };
    if (note) {
      opt = { ...opt, componentProps: { note } };
    }

    const modal = await this.modalController.create(opt);
    modal.present();
    await modal.onDidDismiss();
    this.notes = [...this.tastingNotes.data];
  }

  async remove(note: TastingNote): Promise<void> {
    await this.tastingNotes.remove(note);
    this.notes = [...this.tastingNotes.data];
  }

  async performSync(): Promise<void> {
    await this.sync.execute();
    await this.tastingNotes.refresh();
    this.showSuccess();
    this.notes = [...this.tastingNotes.data];
  }

  setDarkMode() {
    this.preferences.setPrefersDarkMode(!this.prefersDarkMode);
  }

  private async showSuccess(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Sync is complete!',
      duration: 1500,
      position: 'top',
      color: 'success',
    });

    await toast.present();
  }
}
