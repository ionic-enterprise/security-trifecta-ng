import { Injectable } from '@angular/core';
import { TastingNote } from '@app/models';
import { Platform } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { TastingNotesApiService } from '../tasting-notes-api/tasting-notes-api.service';
import { TastingNotesDatabaseService } from '../tasting-notes-database/tasting-notes-database.service';

@Injectable({
  providedIn: 'root',
})
export class TastingNotesService {
  private tastingNotes: Array<TastingNote>;

  constructor(
    private platform: Platform,
    private api: TastingNotesApiService,
    private database: TastingNotesDatabaseService
  ) {}

  get data(): Array<TastingNote> {
    return [...this.tastingNotes];
  }

  async find(id: number): Promise<TastingNote | undefined> {
    if (!this.tastingNotes) {
      await this.refresh();
    }
    return this.tastingNotes.find((x) => x.id === id);
  }

  async load(): Promise<void> {
    if (this.platform.is('hybrid')) {
      const cats = await firstValueFrom(this.api.getAll());
      this.database.trim(cats.map((x) => x.id as number));
      const upserts = cats.map((x) => this.database.upsert(x));
      await Promise.all(upserts);
    }
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.tastingNotes = await (this.platform.is('hybrid') ? this.database.getAll() : firstValueFrom(this.api.getAll()));
  }

  async remove(note: TastingNote): Promise<void> {
    await (this.platform.is('hybrid') ? this.database.remove(note) : firstValueFrom(this.api.remove(note)));
    this.tastingNotes = this.tastingNotes.filter((x) => x.id !== note.id);
  }

  async save(note: TastingNote): Promise<TastingNote> {
    const savedNote = await (this.platform.is('hybrid')
      ? this.database.save(note)
      : firstValueFrom(this.api.save(note)));
    const index = this.tastingNotes.findIndex((x) => x.id === savedNote.id);
    if (index >= 0) {
      this.tastingNotes[index] = savedNote;
    } else {
      this.tastingNotes.push(savedNote);
    }
    return savedNote;
  }
}
