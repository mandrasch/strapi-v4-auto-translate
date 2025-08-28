module.exports = {
  async afterCreate(event) {
    await autoTranslateEntry(event);
  },

  async afterUpdate(event) {
    // Add small delay to avoid race condition
    setTimeout(async () => {
      await autoTranslateEntry(event);
    }, 100);
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

  // 🔍 DEBUG: Log what data we have at this point
  console.log('\n=== AUTO-TRANSLATE DEBUG ===');
  console.log('Entry ID:', result.id);
  console.log('Locale:', result.locale);
  console.log('Published:', !!result.publishedAt);
  console.log('HeroTeaser value:', result.heroTeaser);
  console.log('Title value:', result.title);
  console.log('Full result object keys:', Object.keys(result));

  // 🔍 DEBUG: Fetch fresh data from DB to check for race condition
  try {
    const freshData = await strapi.db.query(contentTypeUid).findOne({
      where: { id: result.id }
    });
    console.log('Fresh DB heroTeaser:', freshData?.heroTeaser);
    console.log('Fresh DB title:', freshData?.title);
    console.log('Data matches?', result.heroTeaser === freshData?.heroTeaser);
  } catch (err) {
    console.error('Failed to fetch fresh data:', err.message);
  }

  try {
    const translateService = strapi.plugin('translate').service('translate');

    if (!translateService) {
      console.error('[auto-translate] Translate service not available');
      return;
    }

    const targetLocales = ['de', 'hu'];

    for (const targetLocale of targetLocales) {
      console.log(`\n🔄 Starting translation for ${targetLocale}...`);

      const batchResult = await translateService.batchTranslate({
        sourceLocale: 'en',
        targetLocale: targetLocale,
        contentType: contentTypeUid,
        entityIds: [result.id],
        autoPublish: true
      });

      console.log(`✅ Batch translate result for ${targetLocale}:`, batchResult);
      console.log(`[auto-translate] Triggered translation: ${result.id} (en -> ${targetLocale})`);
    }

    // 🔍 DEBUG: Check what's in the translate jobs table
    try {
      const jobs = await strapi.db.query('plugin::translate.batch-translate-job').findMany({
        where: { contentType: contentTypeUid },
        orderBy: { createdAt: 'desc' },
        limit: 5
      });
      console.log('\nRecent translate jobs:', jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        sourceLocale: job.sourceLocale,
        targetLocale: job.targetLocale,
        createdAt: job.createdAt
      })));
    } catch (jobErr) {
      console.error('Failed to fetch translate jobs:', jobErr.message);
    }

  } catch (error) {
    console.error('[auto-translate] Translation failed:', error.message);
    console.error('Full error:', error);
  }

  console.log('=== END DEBUG ===\n');
}
