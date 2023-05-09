import { TestBed } from '@angular/core/testing';
import { TastingNote } from '@app/models';
import { of } from 'rxjs';
import { TastingNotesApiService } from '../tasting-notes-api/tasting-notes-api.service';
import { createTastingNotesApiServiceMock } from '../tasting-notes-api/tasting-notes-api.service.mock';
import { TastingNotesDatabaseService } from '../tasting-notes-database/tasting-notes-database.service';
import { createTastingNotesDatabaseServiceMock } from '../tasting-notes-database/tasting-notes-database.service.mock';
import { TastingNotesService } from '../tasting-notes/tasting-notes.service';
import { createTastingNotesServiceMock } from '../tasting-notes/tasting-notes.service.mock';
import { TeaCategoriesService } from '../tea-categories/tea-categories.service';

import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let tastingNotes: Array<TastingNote>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TastingNotesApiService, useFactory: createTastingNotesApiServiceMock },
        { provide: TastingNotesDatabaseService, useFactory: createTastingNotesDatabaseServiceMock },
        { provide: TastingNotesService, useFactory: createTastingNotesServiceMock },
        { provide: TeaCategoriesService, useFactory: createTastingNotesServiceMock },
      ],
    });
    initializeTestData();
    const tastingNotesApiService = TestBed.inject(TastingNotesApiService);
    (tastingNotesApiService.remove as jasmine.Spy).and.returnValue(of(null));
    (tastingNotesApiService.save as jasmine.Spy).and.returnValue(of(tastingNotes[0]));
    const tastingNotesDatabaseService = TestBed.inject(TastingNotesDatabaseService);
    (tastingNotesDatabaseService.getAll as jasmine.Spy).and.returnValue(Promise.resolve(tastingNotes));
    service = TestBed.inject(SyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('execute', () => {
    it('gets the notes for the current user from the database, including deleted notes', async () => {
      const tastingNotesDatabaseService = TestBed.inject(TastingNotesDatabaseService);
      await service.execute();
      expect(tastingNotesDatabaseService.getAll).toHaveBeenCalledTimes(1);
      expect(tastingNotesDatabaseService.getAll).toHaveBeenCalledWith(true);
    });

    it('saves the INSERT and UPDATE items to the API', async () => {
      const tastingNotesApiService = TestBed.inject(TastingNotesApiService);
      await service.execute();
      expect(tastingNotesApiService.save).toHaveBeenCalledTimes(5);
    });

    it('removes the ID for the INSERT items', async () => {
      const tastingNotesApiService = TestBed.inject(TastingNotesApiService);
      await service.execute();
      const { id, ...note } = tastingNotes[0];
      expect(tastingNotesApiService.save).toHaveBeenCalledWith(note);
    });

    it('does not remove the ID for the UPDATE items', async () => {
      const tastingNotesApiService = TestBed.inject(TastingNotesApiService);
      await service.execute();
      expect(tastingNotesApiService.save).toHaveBeenCalledWith(tastingNotes[1]);
    });

    it('calls the backend API to remove the DELETE items', async () => {
      const tastingNotesApiService = TestBed.inject(TastingNotesApiService);
      await service.execute();
      expect(tastingNotesApiService.remove).toHaveBeenCalledTimes(1);
      expect(tastingNotesApiService.remove).toHaveBeenCalledWith(tastingNotes[3]);
    });

    it('clears the cached tasting notes data', async () => {
      const tastingNotesDatabaseService = TestBed.inject(TastingNotesDatabaseService);
      await service.execute();
      expect(tastingNotesDatabaseService.clearSyncStatuses).toHaveBeenCalledTimes(1);
    });

    it('reloads the modified tasting notes from the API into the database', async () => {
      const tastingNotesService = TestBed.inject(TastingNotesService);
      await service.execute();
      expect(tastingNotesService.loadDatabaseFromApi).toHaveBeenCalledTimes(1);
    });

    it('reloads the tea categories from the API into the database', async () => {
      const teaCategoriesService = TestBed.inject(TeaCategoriesService);
      await service.execute();
      expect(teaCategoriesService.loadDatabaseFromApi).toHaveBeenCalledTimes(1);
    });
  });

  const initializeTestData = () => {
    tastingNotes = [
      {
        id: 1,
        brand: 'Lipton',
        name: 'Green',
        notes: 'Bland and dull, but better than their standard tea',
        rating: 2,
        teaCategoryId: 1,
        syncStatus: 'INSERT',
      },
      {
        id: 3,
        brand: 'Rishi',
        name: 'Puer Tuo Cha',
        notes: 'Earthy with a bold a full flavor',
        rating: 5,
        teaCategoryId: 6,
        syncStatus: 'UPDATE',
      },
      {
        id: 42,
        brand: 'Rishi',
        name: 'Elderberry Healer',
        notes: 'Elderberry and ginger. Strong and healthy.',
        rating: 4,
        teaCategoryId: 7,
        syncStatus: 'INSERT',
      },
      {
        id: 73,
        brand: 'Tetley',
        name: 'The Regular Stuff',
        notes: 'Who moved my cottage cheese goat head?',
        rating: 2,
        teaCategoryId: 7,
        syncStatus: 'DELETE',
      },
      {
        id: 134,
        brand: 'Red Label',
        name: 'Baz Bell Beans',
        notes: 'Happy cheese and biscuits fromage.',
        rating: 5,
        teaCategoryId: 6,
        syncStatus: null,
      },
      {
        id: 59,
        brand: 'Taj Tea',
        name: 'Masala Spiced Chai',
        notes: 'Blue when the cheese comes out of everybody.',
        rating: 2,
        teaCategoryId: 3,
        syncStatus: null,
      },
      {
        id: 609,
        brand: 'Rishi',
        name: 'Foobar Flub Flub',
        notes: 'Everyone loves rubber cheese blue castello. Squirty cheesy feet.',
        rating: 2,
        teaCategoryId: 3,
        syncStatus: 'UPDATE',
      },
      {
        id: 420,
        brand: 'Rishi',
        name: 'Fairy Dust Fruitcake',
        notes: 'Fromage frais fromage pepper jack.',
        rating: 3,
        teaCategoryId: 1,
        syncStatus: 'INSERT',
      },
      {
        id: 902,
        brand: 'Tea Tree Trunk',
        name: 'Gopher Tree Bark',
        notes: 'Cheesecake smelly cheese cheese strings gouda monterey.  Cheesy grin paneer cheese and wine.',
        rating: 4,
        teaCategoryId: 7,
        syncStatus: null,
      },
    ];
  };
});
