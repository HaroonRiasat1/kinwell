// Checks every locale against English: no missing keys, no stray keys, same {placeholders}.
// Run: npm run i18n:check -w client
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = fileURLToPath(new URL('../src/i18n/locales/', import.meta.url));
const load = async (f) => (await import(pathToFileURL(dir + f).href)).default;
const en = await load('en.js');
const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
let problems = 0;

for (const file of readdirSync(dir).filter((f) => f !== 'en.js' && f.endsWith('.js'))) {
  const loc = await load(file);
  for (const k of Object.keys(en)) {
    if (!(k in loc)) (problems++, console.log(`${file}: missing "${k}"`));
    else if (vars(en[k]) !== vars(loc[k])) (problems++, console.log(`${file}: placeholders differ in "${k}"`));
  }
  for (const k of Object.keys(loc)) if (!(k in en)) (problems++, console.log(`${file}: unknown key "${k}"`));
}
console.log(problems ? `${problems} problem(s)` : 'All locales complete.');
process.exit(problems ? 1 : 0);
