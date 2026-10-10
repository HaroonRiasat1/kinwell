// Every language the app can show. To add one: add an entry here and a file in ./locales.
export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr', locale: 'en-GB' },
  ur: {
    label: 'اردو',
    dir: 'rtl',
    locale: 'ur-PK-u-nu-latn', // Urdu words, Western digits (what people in Pakistan use on phones)
    font: 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap',
  },
};
export const DEFAULT_LANGUAGE = 'en';
export const isSupported = (code) => Object.hasOwn(LANGUAGES, code);
