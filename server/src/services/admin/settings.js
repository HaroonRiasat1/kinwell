import { ServiceArea } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { record } from './audit.js';
import { areaUsage } from './metrics.js';

export const areas = () => areaUsage();

export async function saveArea(admin, { id, name, capacity }) {
  let area;
  if (id) {
    area = await ServiceArea.findById(id);
    if (!area) throw ApiError.notFound('Area not found');
    area.name = name ?? area.name;
    area.capacity = capacity;
  } else {
    if (await ServiceArea.exists({ name })) throw ApiError.badRequest('That area already exists.');
    area = new ServiceArea({ name, capacity });
  }
  await area.save();
  await record(admin, id ? 'area.update' : 'area.create', id ? `Set ${area.name} capacity to ${area.capacity}` : `Added area ${area.name} (capacity ${area.capacity})`, { kind: 'area', id: area._id, label: area.name });
  return areaUsage();
}

export async function removeArea(admin, id) {
  const usage = (await areaUsage()).find((a) => a.id === id);
  if (!usage) throw ApiError.notFound('Area not found');
  if (usage.clients) throw ApiError.badRequest(`${usage.area} still has ${usage.clients} client${usage.clients > 1 ? 's' : ''}.`);
  await ServiceArea.findByIdAndDelete(id);
  await record(admin, 'area.delete', `Removed area ${usage.area}`, { kind: 'area', id, label: usage.area });
  return areaUsage();
}
