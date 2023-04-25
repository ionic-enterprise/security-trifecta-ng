/* eslint-disable @typescript-eslint/quotes */
import { Injectable } from '@angular/core';
import { TastingNote } from '@app/models';
import { AuthenticationService } from '../authentication/authentication.service';
import { DatabaseService } from '../database/database.service';
import { SessionVaultService } from '../session-vault/session-vault.service';

@Injectable({
  providedIn: 'root',
})
export class TastingNotesDatabaseService {
  constructor(
    private database: DatabaseService,
    private vault: SessionVaultService,
    private authentication: AuthenticationService
  ) {}

  async getAll(includeDeleted = false): Promise<Array<TastingNote>> {
    const notes: Array<TastingNote> = [];
    const handle = await this.database.getHandle();
    if (handle) {
      const email = await this.authentication.getUserEmail();
      const predicate = includeDeleted
        ? 'userEmail = ? ORDER BY name'
        : "coalesce(syncStatus, '') != 'DELETE' AND userEmail = ? ORDER BY brand, name";
      await handle.transaction((tx) =>
        tx.executeSql(
          `SELECT id, name, brand, notes, rating, teaCategoryId, syncStatus FROM TastingNotes WHERE ${predicate}`,
          [email],
          // tslint:disable-next-line:variable-name
          (_t: any, r: any) => {
            for (let i = 0; i < r.rows.length; i++) {
              notes.push(r.rows.item(i));
            }
          }
        )
      );
    }
    return notes;
  }

  async clearSyncStatuses(): Promise<void> {
    const handle = await this.database.getHandle();
    if (handle) {
      const email = await this.authentication.getUserEmail();
      await handle.transaction((tx) => {
        tx.executeSql(
          "UPDATE TastingNotes SET syncStatus = null WHERE syncStatus = 'UPDATE' AND userEmail = ?",
          [email],
          () => {}
        );
        tx.executeSql(
          "DELETE FROM TastingNotes WHERE syncStatus in ('DELETE', 'INSERT') AND userEmail = ?",
          [email],
          () => {}
        );
      });
    }
  }

  async remove(note: TastingNote): Promise<void> {
    const handle = await this.database.getHandle();
    if (handle) {
      const email = await this.authentication.getUserEmail();
      await handle.transaction((tx) => {
        tx.executeSql(
          "UPDATE TastingNotes SET syncStatus = 'DELETE' WHERE userEmail = ? AND id = ?",
          [email, note.id],
          () => {}
        );
      });
    }
  }

  async pruneOthers(notes: Array<TastingNote>): Promise<void> {
    const handle = await this.database.getHandle();
    const idsToKeep = notes.map((note) => note.id);
    if (handle) {
      const email = await this.authentication.getUserEmail();
      await handle.transaction((tx) => {
        tx.executeSql(
          `DELETE FROM TastingNotes WHERE userEmail = ? AND id not in (${this.params(idsToKeep.length)})`,
          [email, ...idsToKeep],
          () => {}
        );
      });
    }
  }

  async save(note: TastingNote): Promise<TastingNote> {
    return (note.id ? await this.update(note) : await this.add(note)) || note;
  }

  async upsert(note: TastingNote): Promise<void> {
    const handle = await this.database.getHandle();
    if (handle) {
      const email = await this.authentication.getUserEmail();
      await handle.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO TastingNotes (id, name, brand, notes, rating, teaCategoryId, userEmail) VALUES (?, ?, ?, ?, ?, ?, ?)' +
            ' ON CONFLICT(id) DO' +
            ' UPDATE SET name = ?, brand = ?, notes = ?, rating = ?, teaCategoryId = ?' +
            ' WHERE syncStatus is NULL AND userEmail = ? AND id = ?',
          [
            note.id,
            note.name,
            note.brand,
            note.notes,
            note.rating,
            note.teaCategoryId,
            email,
            note.name,
            note.brand,
            note.notes,
            note.rating,
            note.teaCategoryId,
            email,
            note.id,
          ],
          () => {}
        );
      });
    }
  }

  async add(note: TastingNote): Promise<TastingNote | undefined> {
    const handle = await this.database.getHandle();
    if (handle) {
      const email = await this.authentication.getUserEmail();
      await handle.transaction((tx) => {
        tx.executeSql(
          'SELECT COALESCE(MAX(id), 0) + 1 AS newId FROM TastingNotes',
          [],
          // tslint:disable-next-line:variable-name
          (_t: any, r: any) => {
            note.id = r.rows.item(0).newId;
            tx.executeSql(
              'INSERT INTO TastingNotes (id, name, brand, notes, rating, teaCategoryId, userEmail, syncStatus)' +
                " VALUES (?, ?, ?, ?, ?, ?, ?, 'INSERT')",
              [note.id, note.name, note.brand, note.notes, note.rating, note.teaCategoryId, email],
              () => {}
            );
          }
        );
      });
      return note;
    }
  }

  async update(note: TastingNote): Promise<TastingNote | undefined> {
    const handle = await this.database.getHandle();
    if (handle) {
      const email = await this.authentication.getUserEmail();
      await handle.transaction((tx) => {
        tx.executeSql(
          'UPDATE TastingNotes SET name = ?, brand = ?, notes = ?, rating = ?, teaCategoryId = ?,' +
            " syncStatus = CASE syncStatus WHEN 'INSERT' THEN 'INSERT' else 'UPDATE' end" +
            ' WHERE userEmail = ? AND id = ?',
          [note.name, note.brand, note.notes, note.rating, note.teaCategoryId, email, note.id],
          () => {}
        );
      });
      return note;
    }
  }

  private params(length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += `${i ? ', ' : ''}?`;
    }
    return str;
  }
}
