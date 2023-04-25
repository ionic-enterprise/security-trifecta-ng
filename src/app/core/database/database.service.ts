import { DbTransaction, SQLite, SQLiteObject } from '@ionic-enterprise/secure-storage/ngx';
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { EncryptionService } from '../encryption/encryption.service';

interface Column {
  name: string;
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private handle: SQLiteObject | null = null;

  constructor(private encryption: EncryptionService, private platform: Platform, private sqlite: SQLite) {}

  async getHandle(): Promise<SQLiteObject | null> {
    if (!this.handle) {
      this.handle = await this.openDatabase();
      if (this.handle) {
        this.handle.transaction((tx) => this.createTables(tx));
      }
    }
    return this.handle;
  }

  private async openDatabase(): Promise<SQLiteObject | null> {
    if (this.platform.is('hybrid')) {
      const key = await this.encryption.getDatabaseKey();
      if (key) {
        return this.sqlite.create({
          name: 'teaisforme.db',
          location: 'default',
          key,
        });
      }
    }
    return null;
  }

  private createTableSQL(name: string, columns: Array<Column>): string {
    let cols = '';
    columns.forEach((c, i) => {
      cols += `${i ? ', ' : ''}${c.name} ${c.type}`;
    });
    return `CREATE TABLE IF NOT EXISTS ${name} (${cols})`;
  }

  private createTables(transaction: DbTransaction): void {
    const id = { name: 'id', type: 'INTEGER PRIMARY KEY' };
    const name = { name: 'name', type: 'TEXT' };
    const description = { name: 'description', type: 'TEXT' };
    const syncStatus = { name: 'syncStatus', type: 'TEXT' };
    transaction.executeSql(this.createTableSQL('TeaCategories', [id, name, description]));
    transaction.executeSql(
      this.createTableSQL('TastingNotes', [
        id,
        name,
        { name: 'brand', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'rating', type: 'INTEGER' },
        { name: 'teaCategoryId', type: 'INTEGER' },
        { name: 'userEmail', type: 'TEXT' },
        syncStatus,
      ])
    );
  }
}
