import { AccessRequest, Family, Flag, LabReport } from '../../models/index.js';
import { weekdayIndex } from '../../utils/time.js';
import { areaUsage, hoursToFamilyUpdate, isNotLogged, notLoggedVisits, visitsThisWeek } from './metrics.js';
import { byUrgency, flagView } from './flags.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export async function overview() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [families, newFamilies, flags, week, notLogged, hours, coverage, failedUploads, pendingAccess] = await Promise.all([
    Family.countDocuments(),
    Family.countDocuments({ createdAt: { $gte: monthStart } }),
    Flag.find({ resolved: false }).sort('-createdAt').populate('link.user', 'name email phone'),
    visitsThisWeek(),
    notLoggedVisits(),
    hoursToFamilyUpdate(),
    areaUsage(),
    LabReport.countDocuments({ status: 'failed' }),
    AccessRequest.countDocuments({ status: 'pending' }),
  ]);

  const today = weekdayIndex(now);
  const weekBars = DAY_NAMES.map((d, i) => {
    const day = week.filter((v) => weekdayIndex(v.scheduledFor) === i);
    const done = day.filter((v) => v.status === 'completed').length;
    const overdue = day.filter((v) => isNotLogged(v, now.getTime())).length;
    return { day: i === today ? 'Today' : d, done, overdue, booked: day.length, upcoming: day.length - done - overdue, isToday: i === today };
  });
  const done = week.filter((v) => v.status === 'completed').length;
  const urgent = flags.filter((f) => f.status === 'attention').length;

  return {
    stats: [
      { key: 'families', label: 'Active families', value: String(families), note: `${newFamilies} joined this month`, to: '/admin/families' },
      { key: 'visits', label: 'Visits this week', value: String(done), note: `of ${week.length} booked`, to: '/admin/nutritionists' },
      { key: 'notLogged', label: 'Visits not logged', value: String(notLogged.length), note: notLogged.length ? 'Past their time, no notes yet' : 'All visits have notes', status: notLogged.length ? 'watch' : 'normal', to: '/admin/nutritionists' },
      { key: 'flags', label: 'Open flags', value: String(flags.length), note: `${plural(urgent, 'needs', 'need')} action today`, status: urgent ? 'attention' : 'normal' },
      { key: 'update', label: 'Time to family update', value: hours === null ? '—' : `${hours.toFixed(1)} h`, note: 'Average, last 30 days · target under 24 h', status: hours !== null && hours > 24 ? 'watch' : 'normal' },
    ],
    queue: flags.sort(byUrgency).map(flagView),
    queues: { labUploads: failedUploads, accessRequests: pendingAccess },
    weekBars,
    coverage,
  };
}
