# Ionic Customer Success Demo - Secure Storage with Identity Vault and Auth Connect

The scenario modeled here is where the application has a need for:

- Securely storing private data using an offline-first strategy.
- Securely storing user options using an offline-first strategy.
- Securely protecting the authentication assets of the application.

For this application, "authentication assets" consist of the session information as well as a key that is used to encrypt the database. For our architecture, the database is shared, and thus the same database encryption key is used across all users. The architecture could easily be expanded so that each user had their own database and their own key.

## Getting Started

Follow all the normal steps:

1. clone the repo
1. install your own `.npmrc` file from one of your production projects
1. `npm i`
1. `npm run build`
1. `npx cap sync`
1. `npx cap open ios` and/or `npx cap open android`

This application takes advantage of a couple of `@ionic-enterprise` solutions. Thus you need to have purchased access to those solutions and have a valid enterprise key in order to try this application.

## Credentials

This application uses a live backend API that requires a login. Unless you have your own credentials, please use the following:

- **email:** `test@ionic.io`
- **password:** `Ion54321`

## Identity Vault Usage

This application uses the Identity Vault product to securely store the user's session. Identity Vault is also used to secure the encryption key for the databases so the data can be accessed offline.

### The Session Vault

The session vault is built in `src/app/core/session-vault/session-vault.service.ts` and follows the same common patterns established as a best-practice implementation in our other Identity Vault demos. Please see the Identity Vault documentation for more information.

### The Encryption Key Vault

This application creates a second vault to store the database encryption key. For this application, we are using a single key that is shared by all databases and all users of the application. As such, a simple vault that, once populated , is never cleared is sufficient.

In addition, there is no reason to lock this vault, so `VaultType.SecureStorage` is used. Using this type of vault results in the encryption key being securely stored, but never locked behind biometrics.

The first time that a user performs an operation requiring the key (generally the first operation performed after logging in), the key will be obtained from the backend and stored in the vault. From that point on, the key will only be obtained from the vault. This ensures that after the initial login, which itself requires a network connection, the application will be able to be used while offline.

## Secure Storage Databases

The Secure Storage product allows for two mode of operation: key-value pair storage, and relational data storage. This application demonstrates each of these operating modes.

### Key-Value Pair Storage

For the key-value pair storage mode of Secure Storage, use the <a href="https://ionic.io/docs/secure-storage/key-value" target="_blank">`Key-Value API`</a>. Doing so allows you to securely store simple key-value pair data on your device. This is best suited for storing sensitive non-relational data.

To see this in action, have a look at `src/app/core/storage/storage.service.ts`. The following code is used to initialize the storage mechanism and ensure that it is encrypted when the application is running on a device in a web-mobile context:

```typescript
private async initialize(): Promise<void> {
  if (!this.ready) {
    this.ready = this.createStorage();
  }
  return this.ready;
}

private async createStorage(): Promise<void> {
  if (this.platform.is('hybrid')) {
    const key = await this.encryption.getDatabaseKey();
    return this.storage.create(key);
  }
  return this.storage.create('');
}
```

Note that the `initialize()` method only performs any work if the `ready` promise is not set. Otherwise, it falls through to return the promise. This ensures that the key-value store is only created once, even if called in rapid succession.

Rather than manually initializing the storage at some point in the application's startup flow, it is safest to create methods that initialize the storage on use when getting or setting the data. This avoids race conditions in the code:

```typescript
async get<T>(key: string): Promise<T> {
  await this.initialize();
  return this.storage.get(key);
}

async set<T>(key: string, value: T): Promise<void> {
  await this.initialize();
  await this.storage.set(key, value);
}
```

With this code in place, the first time that the application gets or sets data in storage in the current session (and while the `key` is available if on mobile), it initialize the storage. On subsequent calls to `get()` or `set()`, the `initialize()` will just return the already resolved `ready` promise.

In this application, we use the key-value storage to save some user preference information. Clearly there are better mechanism to use for most user-preference type data. However, the point here is to show you _how_ you would store key-value pair data securely if you have such a need.

### Running on Web (KV Pair)

Note that the `Key-Value API` also will store key-value pair data in a web based context using the localStorage API. This allows you to use the same code when using `ionic serve` in development that you would also use on your web-mobile application when using Capacitor or Cordova to build your application. **The key-value pair data stored in this way should not be considered secure and should only be used within your development workflow.**

### Relational Data Storage

Secure Storage supports traditional relational database storage for cases where the key-value pair storage is not sufficient. When using relational storage, it is up to your application to create and manage the required tables as well as the CRUD operations that your data model requires.

In this sample, the relational database information is separated into several files:

- `src/app/core/database/database.service.ts` - handles the overall database schema
- `src/app/core/tasting-notes-database/tasting-notes-database.service.ts` - handles the Tasting Notes related CRUD operations
- `src/app/core/tea-categories-database/tea-categories-database.service.ts` - handles the Tea Category related CRUD operations

The `DatabaseService` class contains one public method called `getHandle()`. This method opens and initializes the database if it is not already open and returns then returns a handle to the database. If the database is already open, then the handle i just returned:

```typescript
async getHandle(): Promise<SQLiteObject | null> {
  if (!this.handle) {
    this.handle = await this.openDatabase();
    if (this.handle) {
      this.handle.transaction((tx) => this.createTables(tx));
    }
  }
  return this.handle;
}
```

This allows the CRUD operations to be written in a manner that avoids race conditions:

```typescript
async upsert(cat: TeaCategory): Promise<void> {
  const handle = await this.database.getHandle();
  if (handle) {
    await handle.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO TeaCategories (id, name, description) VALUES (?, ?, ?)' +
          ' ON CONFLICT(id) DO' +
          ' UPDATE SET name = ?, description = ? where id = ?',
        [cat.id, cat.name, cat.description, cat.name, cat.description, cat.id],
        () => {}
      );
    });
  }
}
```

Since getting the handle will open and initialize the data if needed, the application does not need to worry about messy asynchronous startup logic.

## Offline First Implementation

In order to cleanly handle operating offline, this application contains both database and Restful API related CRUD operations. Having a look at the tasting notes, we have the following files:

- `src/app/core/tasting-notes-api/tasting-notes-api.service.ts` - perform tasting notes related CRUD operations against the Restful API
- `src/app/core/tasting-notes-database/tasting-notes-database.service.ts` - perform tasting notes related CRUD operations against the local database
- `src/app/core/tasting-notes/tasting-notes.service.ts` - determine if the application is running in a mobile or a web-based context and behave accordingly

Splitting the responsibilities like this not only adheres to the best-practices of the Single Responsibility Principle, but it also allows use to more cleanly perform the synchronization operations.

### Mobile (Offline First)

The mobile code is written using an offline first methodology. As such, all READ operations comes from the data currently in the database. Similarly, CREATE and UPDATE operations create and update data in the database, marking it as with an INSERT or UPDATE status, and DELETE operations mark the row in the database with a DELETE status.

At appropriate times, the data is then synchronized with the backend Restful API. In this application, those "appropriate times" are at login and whenever the user performs a manual sync via the sync button.

As such, the logic in `src/app/core/tasting-notes/tasting-notes.service.ts` always uses the "database" routines in a mobile context.

### Web (No Offline)

The web application cannot take advantage of the relational database. As such, it is written to only work in an online fashion. The logic in `src/app/core/tasting-notes/tasting-notes.service.ts` uses the "API" routines in a web context.

### Sync

Since all operations in a mobile context are run against the database, we need a way to sync the database with the Restful API. This sample application uses a very simple sync mechanism that could easily be expanded upon if need be. See `/src/app/core/sync/sync.service.ts` for details.

In this application, the only data that can be changed is the tasting notes. Therefore, it has the most complicated sync operation:

```typescript
private async syncTastingNotes(): Promise<void> {
  await this.applyTastingNotesDatabaseChanges();
  await this.tastingNotesDatabase.clearSyncStatuses();
  await this.tastingNotes.loadDatabaseFromApi();
}

private async applyTastingNotesDatabaseChanges(): Promise<void> {
  const saves: Array<Promise<any>> = [];
  const notes = await this.tastingNotesDatabase.getAll(true);
  notes.forEach((note) => {
    if (note.syncStatus === 'INSERT') {
      const { id, ...noteWithoutId } = note;
      saves.push(firstValueFrom(this.tastingNotesApi.save(noteWithoutId)));
    }
    if (note.syncStatus === 'UPDATE') {
      saves.push(firstValueFrom(this.tastingNotesApi.save(note)));
    }
    if (note.syncStatus === 'DELETE') {
      saves.push(firstValueFrom(this.tastingNotesApi.remove(note)));
    }
  });
  await Promise.all(saves);
}
```

The order of operations is:

- Get all notes from the database, including those marked for DELETE.
- Save the UPDATEs to the Restful API.
- Save the INSERTs to the Restful API.
- Delete the DELETE items from the Restful API.
- Reset the flags in the database.
- Reload data from the Restful API. This will "upsert" the data as well as remove any data from the database that no longer exists on the backend server.

Since the Tea Categories cannot be maintained by this application, we only need to perform the reload stop for them.

This is a very simple sync operation. It does not take items such as crash detection and mitigation into account. If your application needs that, then you will need to expand this pattern to meet your needs.

## Conclusion

This application demonstrates the basics of using Secure Storage in an offline-first oriented application. It provides patterns and best-practices that can be expanded upon to construct larger and more full featured applications.

Happy Coding!!
