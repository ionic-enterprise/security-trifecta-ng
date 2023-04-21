import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TastingNotesService, TeaCategoriesService } from '@app/core';
import { createTastingNotesServiceMock, createTeaCategoriesServiceMock } from '@app/core/testing';
import { TeaCategory } from '@app/models';
import { ModalController } from '@ionic/angular';
import { createOverlayControllerMock } from '@test/mocks';
import { click } from '@test/util';

import { TastingNoteEditorComponent } from './tasting-note-editor.component';

describe('TastingNoteEditorComponent', () => {
  let categories: Array<TeaCategory>;
  let component: TastingNoteEditorComponent;
  let fixture: ComponentFixture<TastingNoteEditorComponent>;
  let modalController: ModalController;

  beforeEach(waitForAsync(() => {
    modalController = createOverlayControllerMock('ModalController');
    TestBed.configureTestingModule({
      imports: [TastingNoteEditorComponent],
      providers: [],
    })
      .overrideProvider(ModalController, { useValue: modalController })
      .overrideProvider(TastingNotesService, { useFactory: createTastingNotesServiceMock })
      .overrideProvider(TeaCategoriesService, { useFactory: createTeaCategoriesServiceMock })
      .compileComponents();

    initializeTestData();

    const teaCategories = TestBed.inject(TeaCategoriesService);
    (Object.getOwnPropertyDescriptor(teaCategories, 'data').get as jasmine.Spy).and.returnValue(categories);

    fixture = TestBed.createComponent(TastingNoteEditorComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('binds the teas in the select', () => {
      fixture.detectChanges();
      const sel = fixture.debugElement.query(By.css('ion-select'));
      const opts = sel.queryAll(By.css('ion-select-option'));
      expect(opts.length).toBe(3);
      expect(opts[0].nativeElement.value).toBe('1');
      expect(opts[0].nativeElement.textContent).toBe('Green');
      expect(opts[1].nativeElement.value).toBe('2');
      expect(opts[1].nativeElement.textContent).toBe('Black');
      expect(opts[2].nativeElement.value).toBe('3');
      expect(opts[2].nativeElement.textContent).toBe('Herbal');
    });

    describe('without a note', () => {
      beforeEach(() => {
        fixture.detectChanges();
      });

      it('has the add title', () => {
        const el = fixture.debugElement.query(By.css('ion-title'));
        expect(el.nativeElement.textContent).toEqual('Add New Tasting Note');
      });

      it('has the add button label', () => {
        const footer = fixture.debugElement.query(By.css('ion-footer'));
        const el = footer.query(By.css('ion-button'));
        expect(el.nativeElement.textContent).toEqual('Add');
      });
    });

    describe('with a note', () => {
      beforeEach(() => {
        component.note = {
          id: 7,
          brand: 'Lipton',
          name: 'Yellow Label',
          notes: 'Overly acidic, highly tannic flavor',
          rating: 1,
          teaCategoryId: 3,
        };
        fixture.detectChanges();
      });

      it('sets the properties', () => {
        expect(component.brand).toEqual('Lipton');
        expect(component.name).toEqual('Yellow Label');
        expect(component.notes).toEqual('Overly acidic, highly tannic flavor');
        expect(component.rating).toEqual(1);
        expect(component.teaCategoryId).toEqual('3');
      });

      it('has the update title', () => {
        const el = fixture.debugElement.query(By.css('ion-title'));
        expect(el.nativeElement.textContent).toEqual('Tasting Note');
      });

      it('has the update button label', () => {
        const footer = fixture.debugElement.query(By.css('ion-footer'));
        const el = footer.query(By.css('ion-button'));
        expect(el.nativeElement.textContent).toEqual('Update');
      });
    });
  });

  describe('save', () => {
    describe('a new note', () => {
      beforeEach(() => {
        fixture.detectChanges();
      });

      it('dispatches the save with the data', fakeAsync(() => {
        const button = fixture.debugElement.query(By.css('[data-testid="save-button"]'));
        const tastingNotesService = TestBed.inject(TastingNotesService);
        component.brand = 'Lipton';
        component.name = 'Yellow Label';
        component.teaCategoryId = '3';
        component.rating = 1;
        component.notes = 'ick';
        click(fixture, button.nativeElement);
        tick();
        expect(tastingNotesService.save).toHaveBeenCalledTimes(1);
        expect(tastingNotesService.save).toHaveBeenCalledWith({
          brand: 'Lipton',
          name: 'Yellow Label',
          teaCategoryId: 3,
          rating: 1,
          notes: 'ick',
        });
      }));

      it('dismisses the modal', fakeAsync(() => {
        const button = fixture.debugElement.query(By.css('[data-testid="save-button"]'));
        click(fixture, button.nativeElement);
        tick();
        expect(modalController.dismiss).toHaveBeenCalledTimes(1);
      }));
    });

    describe('an existing note', () => {
      beforeEach(() => {
        component.note = {
          id: 73,
          brand: 'Generic',
          name: 'White Label',
          teaCategoryId: 2,
          rating: 3,
          notes: 'it is ok',
        };
        fixture.detectChanges();
      });

      it('dispatches the save with the data', fakeAsync(() => {
        const tastingNotesService = TestBed.inject(TastingNotesService);
        const button = fixture.debugElement.query(By.css('[data-testid="save-button"]'));
        component.brand = 'Lipton';
        component.name = 'Yellow Label';
        component.teaCategoryId = '3';
        component.rating = 1;
        component.notes = 'ick';
        click(fixture, button.nativeElement);
        tick();
        expect(tastingNotesService.save).toHaveBeenCalledTimes(1);
        expect(tastingNotesService.save).toHaveBeenCalledWith({
          id: 73,
          brand: 'Lipton',
          name: 'Yellow Label',
          teaCategoryId: 3,
          rating: 1,
          notes: 'ick',
        });
      }));

      it('dismisses the modal', fakeAsync(() => {
        const button = fixture.debugElement.query(By.css('[data-testid="save-button"]'));
        click(fixture, button.nativeElement);
        tick();
        expect(modalController.dismiss).toHaveBeenCalledTimes(1);
      }));
    });
  });

  describe('close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('does not save any changes', fakeAsync(() => {
      const button = fixture.debugElement.query(By.css('[data-testid="close-button"]'));
      const tastingNotesService = TestBed.inject(TastingNotesService);
      component.brand = 'Lipton';
      component.name = 'Yellow Label';
      component.teaCategoryId = '3';
      component.rating = 1;
      component.notes = 'ick';
      click(fixture, button.nativeElement);
      tick();
      expect(tastingNotesService.save).not.toHaveBeenCalled();
    }));

    it('dismisses the modal', fakeAsync(() => {
      const button = fixture.debugElement.query(By.css('[data-testid="close-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(modalController.dismiss).toHaveBeenCalledTimes(1);
    }));
  });

  const initializeTestData = () => {
    categories = [
      {
        id: 1,
        name: 'Green',
        description: 'Green tea description.',
      },
      {
        id: 2,
        name: 'Black',
        description: 'Black tea description.',
      },
      {
        id: 3,
        name: 'Herbal',
        description: 'Herbal Infusion description.',
      },
    ];
  };
});
