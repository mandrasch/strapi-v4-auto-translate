module.exports = {
  async afterCreate(event) {
    await autoTranslateEntry(event);
  },

  async afterUpdate(event) {
    await autoTranslateEntry(event);
  },
};

async function autoTranslateEntry(event) {
  const { result, params } = event;
  const strapi = global.strapi;

  // Only handle English published entries
  if (result.locale !== 'en' || !result.publishedAt || params?.meta?.translatedByPlugin) {
    return;
  }

  const contentTypeUid = result.__contentTypeUid || event.model?.uid;
  if (!contentTypeUid) return;

  try {
    const translateService = strapi.plugin('translate').service('translate');

    if (!translateService) {
      console.error('[auto-translate] Translate service not available');
      return;
    }

    // The plugin should handle everything: create localizations + translate + auto-publish
    const targetLocales = ['de', 'hu'];

    for (const targetLocale of targetLocales) {
      await translateService.batchTranslate({
        sourceLocale: 'en',
        targetLocale: targetLocale,
        contentType: contentTypeUid,
        entityIds: [result.id],
        autoPublish: true  // Enable auto-publish for this batch job
      });

      console.log(`[auto-translate] Triggered translation with auto-publish: ${result.id} (en -> ${targetLocale})`);
    }

  } catch (error) {
    console.error('[auto-translate] Translation failed:', error.message);
  }
}
