// Normalises phone numbers to E.164 so "+92 300 111 2233", "0300-1112233" and
// "923001112233" all match the same stored number. Local numbers default to Pakistan.
export function normalizePhone(input, defaultCountry = '92') {
  if (!input) return '';
  let s = String(input).trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (s.startsWith('+')) return `+${s.slice(1).replace(/\D/g, '')}`;
  s = s.replace(/\D/g, '');
  if (s.startsWith('0')) return `+${defaultCountry}${s.slice(1)}`;
  if (s.startsWith(defaultCountry) && s.length > 10) return `+${s}`;
  return `+${defaultCountry}${s}`;
}
