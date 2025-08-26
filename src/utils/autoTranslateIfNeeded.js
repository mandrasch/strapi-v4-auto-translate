const { cleanData } = require('./strapi-plugin-translate/clean-data')
const { updateUids } = require('./strapi-plugin-translate/update-uids')
const { removeUids } = require('./strapi-plugin-translate/remove-uids')
const { filterAllDeletedFields } = require('./strapi-plugin-translate/delete-fields')

/**
 * Duplicate a component inside a dynamic zone to avoid relational ID issues
 */
function duplicateComponent(component) {
  const newComp = { ...component }
  delete newComp.id
  delete newComp.createdBy
  delete newComp.updatedBy
  delete newComp.createdAt
  delete newComp.updatedAt
  return newComp
}

async function autoTranslateIfNeeded(event) {
  const { result, params } = event
  const strapi = global.strapi

  if (!result.locale || result.locale !== 'en') return

  // Prevent deathloop
  if (params?.meta?.translatedByPlugin) return

  console.log('--------------------------------------------------------')
  console.log('autoTranslateIfNeeded running for locale:', result.locale)
  console.log('params.data:', JSON.stringify(params.data))

  const contentTypeUid = result.__contentTypeUid || event.model?.uid
  if (!contentTypeUid) {
    console.error('[translate] Could not determine contentTypeUid:', { result, model: event.model })
    return
  }

  const contentSchema = strapi.contentTypes[contentTypeUid]
  if (!contentSchema) {
    console.error('[translate] Content type not found:', contentTypeUid)
    return
  }

  const targetLocales = ['de', 'hu']
  const translatableFields = ['title', 'heroTeaser'] // add your fields
  const dynamicZoneFields = ['contents']
  const localizedIds = []

  // Create/update localized entries
  for (const targetLocale of targetLocales) {
    if (targetLocale === 'en') continue

    let localized = null
    try {
      localized = await strapi.db.query(contentTypeUid).findOne({
        where: { locale: targetLocale, localizations: { id: result.id } },
        populate: { localizations: true },
      })
      console.log(`[translate] Existing localized entry for ${targetLocale}:`, localized ? localized.id : 'none')
    } catch (err) {
      console.error(`[translate] Failed fetching localized entry for ${targetLocale}:`, err)
    }

    try {
      const translatedData = { ...result }
      const timestamp = new Date().toLocaleTimeString()

      // Simulate translation
      translatableFields.forEach(f => {
        if (translatedData[f]) {
          translatedData[f] = `${translatedData[f]} (TRANSLATED - ${timestamp})`
        }
      })

      // Duplicate dynamic zones
      dynamicZoneFields.forEach(f => {
        if (Array.isArray(translatedData[f])) {
          translatedData[f] = translatedData[f].map(duplicateComponent)
        }
      })

      const translatedRelations = strapi.config.get('plugin.translate')?.regenerateUids
        ? await updateUids(translatedData, contentTypeUid)
        : removeUids(translatedData, contentTypeUid)

      const cleanedData = cleanData(filterAllDeletedFields(translatedRelations, contentSchema), contentSchema, true)

      const mysqlSafeData = { ...cleanedData }
      delete mysqlSafeData.createdBy
      delete mysqlSafeData.updatedBy
      delete mysqlSafeData.createdAt
      delete mysqlSafeData.updatedAt

      // Convert relational fields to IDs
      const relationalFields = ['localizations']
      relationalFields.forEach(f => {
        if (Array.isArray(mysqlSafeData[f])) {
          mysqlSafeData[f] = mysqlSafeData[f].map(item => (item?.id ? item.id : item))
        } else if (mysqlSafeData[f]?.id) {
          mysqlSafeData[f] = mysqlSafeData[f].id
        }
      })

      // Create or update localized entry
      let entryId
      if (localized) {
        const updated = await strapi.db.query(contentTypeUid).update({
          where: { id: localized.id },
          data: { ...mysqlSafeData, localizations: localized.localizations.map(l => l.id) },
          meta: { translatedByPlugin: true },
        })
        entryId = localized.id
        console.log(`[translate] Updated localized entry: ${localized.id}`)
      } else {
        const created = await strapi.db.query(contentTypeUid).create({
          data: { ...mysqlSafeData, locale: targetLocale, localizations: [result.id] },
          meta: { translatedByPlugin: true },
        })
        entryId = created.id
        console.log(`[translate] Created new localized entry: ${created.id}`)
      }

      localizedIds.push(entryId)
    } catch (err) {
      console.error(`[translate] Failed simulating translation for ${targetLocale}:`, err)
    }
  }

  // Finally, update all entries (original + localized) to include all localized IDs
  const allLocalizedIds = [result.id, ...localizedIds]
  for (const id of allLocalizedIds) {
    try {
      await strapi.db.query(contentTypeUid).update({
        where: { id },
        data: { localizations: allLocalizedIds },
        meta: { translatedByPlugin: true },
      })
    } catch (err) {
      console.error(`[translate] Failed updating localizations for entry ${id}:`, err)
    }
  }

  console.log('[translate] Synced all localized entries with IDs:', allLocalizedIds.join(','))
}

module.exports = { autoTranslateIfNeeded }
