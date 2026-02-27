import Dexie from 'dexie';

export const db = new Dexie('CoinCatalog');

// Version 1
db.version(1).stores({
  coins: '++id, country, year, denomination, mintMark, marketValue, valueChecked, createdAt'
});

// Version 2: Add uuid index for import/export deduplication
db.version(2).stores({
  coins: '++id, &uuid, country, year, denomination, mintMark'
}).upgrade(async tx => {
  // Populate uuid for existing records
  await tx.table('coins').toCollection().modify(coin => {
    if (!coin.uuid) {
      coin.uuid = crypto.randomUUID();
    }
  });
});
