import { Parent, ServiceArea, User } from '../models/index.js';

// Small, idempotent data updates that run once per server start, after connecting. Each one is
// safe to repeat: it only touches documents that still need it.
export async function runMigrations() {
  // Several cities: service areas, parents and nutritionists from before had no city (all Lahore),
  // and area names were unique across the whole country.
  await ServiceArea.updateMany({ city: { $exists: false } }, { $set: { city: 'Lahore' } });
  await Parent.updateMany({ $or: [{ city: { $exists: false } }, { city: '' }] }, { $set: { city: 'Lahore' } });
  await User.updateMany({ role: 'nutritionist', $or: [{ city: { $exists: false } }, { city: '' }] }, { $set: { city: 'Lahore' } });
  const indexes = await ServiceArea.collection.indexes().catch(() => []);
  if (indexes.some((i) => i.name === 'name_1')) await ServiceArea.collection.dropIndex('name_1');
  await ServiceArea.syncIndexes();
}
