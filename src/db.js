import Dexie from 'dexie';

export const db = new Dexie('CoinCatalog');

db.version(1).stores({
  coins: '++id, country, year, denomination, mintMark, marketValue, valueChecked, createdAt' // Primary key and indexed props
});
