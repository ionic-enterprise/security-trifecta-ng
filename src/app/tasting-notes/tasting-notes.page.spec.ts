import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  AuthenticationService,
  PreferencesService,
  SessionVaultService,
  SyncService,
  TastingNotesService,
  TeaCategoriesService,
} from '@app/core';
import { createSyncServiceMock } from '@app/core/sync/sync.service.mock';
import {
  createAuthenticationServiceMock,
  createPreferencesServiceMock,
  createSessionVaultServiceMock,
  createTastingNotesServiceMock,
  createTeaCategoriesServiceMock,
} from '@app/core/testing';
import { TastingNote } from '@app/models';
import { TastingNoteEditorComponent } from '@app/tasting-note-editor/tasting-note-editor.component';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import { createNavControllerMock, createOverlayControllerMock, createOverlayElementMock } from '@test/mocks';
import { click } from '@test/util';
import { of } from 'rxjs';
import { TastingNotesPage } from './tasting-notes.page';

describe('TastingNotesPage', () => {
  let component: TastingNotesPage;
  let fixture: ComponentFixture<TastingNotesPage>;
  let modal: HTMLIonModalElement;
  let toast: HTMLIonToastElement;
  let notes: Array<TastingNote>;
  let modalController: ModalController;
  let toastController: ToastController;

  beforeEach(async () => {
    modal = createOverlayElementMock('Modal');
    modalController = createOverlayControllerMock('ModalController', modal);
    toast = createOverlayElementMock('Toast');
    toastController = createOverlayControllerMock('TaastController', toast);

    await TestBed.configureTestingModule({
      imports: [TastingNotesPage],
      providers: [],
    })
      .overrideProvider(AuthenticationService, { useFactory: createAuthenticationServiceMock })
      .overrideProvider(ModalController, { useValue: modalController })
      .overrideProvider(NavController, { useFactory: createNavControllerMock })
      .overrideProvider(PreferencesService, { useFactory: createPreferencesServiceMock })
      .overrideProvider(SessionVaultService, { useFactory: createSessionVaultServiceMock })
      .overrideProvider(SyncService, { useFactory: createSyncServiceMock })
      .overrideProvider(TastingNotesService, { useFactory: createTastingNotesServiceMock })
      .overrideProvider(TeaCategoriesService, { useFactory: createTeaCategoriesServiceMock })
      .overrideProvider(ToastController, { useValue: toastController })
      .compileComponents();

    initializeTestData();

    const preferences = TestBed.inject(PreferencesService);
    (preferences as any).prefersDarkMode = false;

    const tastingNotes = TestBed.inject(TastingNotesService);
    (Object.getOwnPropertyDescriptor(tastingNotes, 'data').get as jasmine.Spy).and.returnValue(notes);

    fixture = TestBed.createComponent(TastingNotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the preferences', () => {
    const preferences = TestBed.inject(PreferencesService);
    expect(preferences.load).toHaveBeenCalledTimes(1);
  });

  describe('tea categories', () => {
    it('are refreshed when the page is loaded', () => {
      const teaCategories = TestBed.inject(TeaCategoriesService);
      expect(teaCategories.refresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('notes', () => {
    beforeEach(waitForAsync(() => {
      fixture.detectChanges();
    }));

    it('are refreshed when the page is loaded', () => {
      const tastingNotes = TestBed.inject(TastingNotesService);
      expect(tastingNotes.refresh).toHaveBeenCalledTimes(1);
    });

    it('displays the notes', () => {
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('ion-item'));
      expect(items.length).toEqual(notes.length);
      expect(items[0].nativeElement.textContent).toContain(notes[0].brand);
      expect(items[1].nativeElement.textContent).toContain(notes[1].brand);
      expect(items[2].nativeElement.textContent).toContain(notes[2].brand);
    });
  });

  describe('adding a note', () => {
    it('creates a modal', fakeAsync(() => {
      const button = fixture.debugElement.query(By.css('[data-testid="add-note-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(modalController.create).toHaveBeenCalledTimes(1);
      expect(modalController.create).toHaveBeenCalledWith({
        component: TastingNoteEditorComponent,
        backdropDismiss: false,
      });
    }));

    it('presents the modal', fakeAsync(() => {
      const button = fixture.debugElement.query(By.css('[data-testid="add-note-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(modal.present).toHaveBeenCalledTimes(1);
    }));
  });

  describe('editing  a note', () => {
    beforeEach(waitForAsync(() => {
      fixture.detectChanges();
    }));

    it('creates a modal', fakeAsync(() => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('ion-item');
      const item = items[1] as HTMLIonItemElement;
      click(fixture, item);
      tick();
      expect(modalController.create).toHaveBeenCalledTimes(1);
      expect(modalController.create).toHaveBeenCalledWith({
        component: TastingNoteEditorComponent,
        backdropDismiss: false,
        componentProps: { note: notes[1] },
      });
    }));

    it('presents the modal', fakeAsync(() => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('ion-item');
      const item = items[1] as HTMLIonItemElement;
      click(fixture, item);
      tick();
      expect(modal.present).toHaveBeenCalledTimes(1);
    }));
  });

  describe('remove a note', () => {
    beforeEach(waitForAsync(() => {
      fixture.detectChanges();
    }));

    it('removes the note', () => {
      fixture.detectChanges();
      const tastingNotes = TestBed.inject(TastingNotesService);
      const buttons = fixture.nativeElement.querySelectorAll('[data-testid="delete-button"]');
      const button = buttons[1] as HTMLIonButtonElement;
      click(fixture, button);
      expect(tastingNotes.remove).toHaveBeenCalledTimes(1);
      expect(tastingNotes.remove).toHaveBeenCalledWith(notes[1]);
    });

    it('displays the remaining notes', fakeAsync(() => {
      fixture.detectChanges();
      const tastingNotes = TestBed.inject(TastingNotesService);
      const buttons = fixture.nativeElement.querySelectorAll('[data-testid="delete-button"]');
      const button = buttons[1] as HTMLIonButtonElement;
      (Object.getOwnPropertyDescriptor(tastingNotes, 'data').get as jasmine.Spy).and.returnValue([notes[0], notes[2]]);
      click(fixture, button);
      tick();
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('ion-item'));
      expect(items.length).toEqual(notes.length - 1);
      expect(items[0].nativeElement.textContent).toContain(notes[0].brand);
      expect(items[1].nativeElement.textContent).toContain(notes[2].brand);
    }));
  });

  describe('logout button', () => {
    let button: HTMLIonButtonElement;
    beforeEach(() => {
      const auth = TestBed.inject(AuthenticationService);
      (auth.logout as jasmine.Spy).and.resolveTo(undefined);
      button = fixture.nativeElement.querySelector('[data-testid="logout-button"]');
    });

    it('performs a logout', fakeAsync(() => {
      const auth = TestBed.inject(AuthenticationService);
      click(fixture, button);
      tick();
      expect(auth.logout).toHaveBeenCalledTimes(1);
    }));

    it('clears the session vault', fakeAsync(() => {
      const vault = TestBed.inject(SessionVaultService);
      click(fixture, button);
      tick();
      expect(vault.clearSession).toHaveBeenCalledTimes(1);
    }));

    it('redirects to the login page', fakeAsync(() => {
      const nav = TestBed.inject(NavController);
      click(fixture, button);
      tick();
      expect(nav.navigateRoot).toHaveBeenCalledTimes(1);
      expect(nav.navigateRoot).toHaveBeenCalledWith(['/', 'login']);
    }));
  });

  describe('dark mode toggle', () => {
    let toggle: HTMLIonToggleElement;
    beforeEach(() => {
      toggle = fixture.nativeElement.querySelector('[data-testid="dark-mode-toggle"]');
    });

    it('starts with the preferences defined value', () => {
      expect(component.prefersDarkMode).toBe(false);
    });

    it('toggle the preferences value on click', fakeAsync(() => {
      const preferences = TestBed.inject(PreferencesService);
      click(fixture, toggle);
      tick();
      expect(preferences.setPrefersDarkMode).toHaveBeenCalledTimes(1);
      expect(preferences.setPrefersDarkMode).toHaveBeenCalledWith(true);
    }));
  });

  describe('sync button', () => {
    let button: HTMLIonButtonElement;
    beforeEach(() => {
      button = fixture.nativeElement.querySelector('[data-testid="sync-button"]');
    });

    it('executes a sync', fakeAsync(() => {
      const sync = TestBed.inject(SyncService);
      click(fixture, button);
      tick();
      expect(sync.execute).toHaveBeenCalledTimes(1);
    }));

    it('executes a refresh of the notes', fakeAsync(() => {
      const tastingNotes = TestBed.inject(TastingNotesService);
      (tastingNotes.refresh as jasmine.Spy).calls.reset();
      click(fixture, button);
      tick();
      expect(tastingNotes.refresh).toHaveBeenCalledTimes(1);
    }));

    it('pops a toast', fakeAsync(() => {
      click(fixture, button);
      tick();
      expect(toast.present).toHaveBeenCalledTimes(1);
    }));
  });

  const initializeTestData = () => {
    notes = [
      {
        id: 42,
        brand: 'Lipton',
        name: 'Green Tea',
        teaCategoryId: 3,
        rating: 3,
        notes: 'A basic green tea, very passable but nothing special',
      },
      {
        id: 314159,
        brand: 'Lipton',
        name: 'Yellow Label',
        teaCategoryId: 2,
        rating: 1,
        notes: 'Very acidic, even as dark teas go, OK for iced tea, horrible for any other application',
      },
      {
        id: 73,
        brand: 'Rishi',
        name: 'Puer Cake',
        teaCategoryId: 6,
        rating: 5,
        notes: 'Smooth and peaty, the king of puer teas',
      },
    ];
  };
});
