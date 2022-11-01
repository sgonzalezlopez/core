const { I18n } = require('i18n');
const path = require('path');

const i18n = new I18n({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  directory: './locales',
  queryParameter : 'lang',
  syncFiles: true,
  extension: '.json'
});

module.exports = i18n;