/**
 * Internationalization utility for BrowseScribe
 * Simple i18n implementation for browser extension
 */

type Locale = 'en' | 'ja';
type TranslationKey = string;

interface TranslationData {
  [key: string]: string | TranslationData;
}

class I18n {
  private currentLocale: Locale = 'ja'; // Default to Japanese
  private translations: Map<Locale, TranslationData> = new Map();

  constructor() {
    this.loadTranslations();
  }

  /**
   * Load translation files
   */
  private async loadTranslations() {
    try {
      // Load Japanese translations
      const jaResponse = await fetch('/locales/ja.json');
      const jaData = await jaResponse.json();
      this.translations.set('ja', jaData);

      // Load English translations
      const enResponse = await fetch('/locales/en.json');
      const enData = await enResponse.json();
      this.translations.set('en', enData);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  /**
   * Set the current locale
   */
  setLocale(locale: Locale) {
    this.currentLocale = locale;
  }

  /**
   * Get the current locale
   */
  getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * Translate a key to the current locale
   */
  t(key: TranslationKey, fallback?: string): string {
    const translations = this.translations.get(this.currentLocale);
    if (!translations) {
      return fallback || key;
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return typeof value === 'string' ? value : fallback || key;
  }

  /**
   * Get all available locales
   */
  getAvailableLocales(): Locale[] {
    return ['ja', 'en'];
  }
}

// Create singleton instance
export const i18n = new I18n();

// Export utility function for easier usage
export const t = (key: TranslationKey, fallback?: string) => i18n.t(key, fallback);

export default i18n;