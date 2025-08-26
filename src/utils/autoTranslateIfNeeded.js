const { cleanData } = require('./strapi-plugin-translate/clean-data');
const { updateUids } = require('./strapi-plugin-translate/update-uids');
const { removeUids } = require('./strapi-plugin-translate/remove-uids');
const { filterAllDeletedFields } = require('./strapi-plugin-translate/delete-fields');

/**
 * Duplicate a component inside a dynamic zone to avoid relational ID issues
 */
function duplicateComponent(component) {
  const newComp = { ...component };
  delete newComp.id;
  delete newComp.createdBy;
  delete newComp.updatedBy;
  delete newComp.createdAt;
  delete newComp.updatedAt;
  return newComp;
}

async function autoTranslateIfNeeded(event) {
  const { result, params } = event;
  const strapi = global.strapi;

  // quick fix for cleaning up the db if deathloop occured
  /*const contentTypeUid1 = 'api::page.page'; // Replace with your actual collection UID
  await strapi.db.query(contentTypeUid1).deleteMany({
    where: {}, // empty filter matches all entries
  });*/

  // Only handle content updates for 'en' (main source)
  if (!result.locale || result.locale !== 'en') return;

  // Prevent deathloop
  if (params?.meta?.translatedByPlugin) return;

  // Only run if the entry is published
  if (!result.publishedAt) {
    console.log('[translate] Entry is not published yet, skipping translation.');
    return;
  }

  const contentTypeUid = result.__contentTypeUid || event.model?.uid;
  if (!contentTypeUid) return;

  const contentSchema = strapi.contentTypes[contentTypeUid];
  if (!contentSchema) return;

  const targetLocales = ['de', 'hu'];
  const translatableFields = ['title', 'heroTeaser'];
  const dynamicZoneFields = ['contents'];
  const localizedIds = [];

  // Create/update localized entries
  for (const targetLocale of targetLocales) {
    if (targetLocale === 'en') continue;

    let localized = null;
    try {
      localized = await strapi.db.query(contentTypeUid).findOne({
        where: { locale: targetLocale, localizations: { id: result.id } },
        populate: { localizations: true },
      });
    } catch (err) {
      console.error(`[translate] Failed fetching localized entry for ${targetLocale}:`, err);
    }

    try {
      const translatedData = { ...result };
      const timestamp = new Date().toLocaleTimeString();

      // Simulate translation
      translatableFields.forEach(f => {
        if (translatedData[f]) {
          translatedData[f] = `${translatedData[f]} (TRANSLATED - ${timestamp})`;
        }
      });

      // Duplicate dynamic zones
      dynamicZoneFields.forEach(f => {
        if (Array.isArray(translatedData[f])) {
          translatedData[f] = translatedData[f].map(duplicateComponent);
        }
      });

      const translatedRelations = strapi.config.get('plugin.translate')?.regenerateUids
        ? await updateUids(translatedData, contentTypeUid)
        : removeUids(translatedData, contentTypeUid);

      const cleanedData = cleanData(filterAllDeletedFields(translatedRelations, contentSchema), contentSchema, true);

      const mysqlSafeData = { ...cleanedData };
      delete mysqlSafeData.createdBy;
      delete mysqlSafeData.updatedBy;
      delete mysqlSafeData.createdAt;
      delete mysqlSafeData.updatedAt;

      // Important!
      delete mysqlSafeData.localizations

      // Convert relational fields to IDs
      const relationalFields = ['localizations'];
      relationalFields.forEach(f => {
        if (Array.isArray(mysqlSafeData[f])) {
          mysqlSafeData[f] = mysqlSafeData[f].map(item => (item?.id ? item.id : item));
        } else if (mysqlSafeData[f]?.id) {
          mysqlSafeData[f] = mysqlSafeData[f].id;
        }
      });

      // Create or update localized entry
      let entryId;

      // Don't mess with localizations here!
      if (localized) {
        await strapi.db.query(contentTypeUid).update({
          where: { id: localized.id },
          data: { ...mysqlSafeData },
          meta: { translatedByPlugin: true },
        });
        entryId = localized.id;
      } else {
        const created = await strapi.db.query(contentTypeUid).create({
          data: { ...mysqlSafeData, locale: targetLocale },
          meta: { translatedByPlugin: true },
        });
        entryId = created.id;
      }

      localizedIds.push(entryId);
    } catch (err) {
      console.error(`[translate] Failed simulating translation for ${targetLocale}:`, err);
    }
  }

  // TODO: Does not work, connections get lost after updating published EN entry

  // Finally sync connected localizations

  // We need to do this because we might disable translation for some languages
  // and the localization id connection would be lost
  let allIds = [];
  try {
    const entries = await strapi.db.query(contentTypeUid).findMany({
      where: {
        $or: [
          { id: result.id },              // the original English entry
          { localizations: { id: result.id } }, // any localized entries pointing to it
        ],
      },
      select: ['id'], // we only need the IDs
    });
    allIds = entries.map(e => e.id); // extract the IDs
  } catch (err) {
    console.error('[translate] Failed fetching all localized entries:', err);
  }

  // Combine with newly created/updated IDs
  const finalIds = Array.from(new Set([...allIds, ...localizedIds]));

  // Update **all entries in the set** to point to each other
  for (const id of finalIds) {
    const localizationsForThisEntry = finalIds.filter(x => x !== id);

    await strapi.db.query(contentTypeUid).update({
      where: { id },
      data: { localizations: localizationsForThisEntry },
      meta: { translatedByPlugin: true },
    });

    console.log(`[translate] Updated entry ${id} localizations:`, localizationsForThisEntry);
  }

  console.log(`[translate] Synced all entries in set with IDs: ${finalIds.join(',')}`);
}

module.exports = { autoTranslateIfNeeded };
