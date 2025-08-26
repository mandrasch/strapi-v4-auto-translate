const { autoTranslateIfNeeded } = require('../../../../utils/autoTranslateIfNeeded')

module.exports = {
  async afterCreate(event) {
    await autoTranslateIfNeeded(event)
  },

  async afterUpdate(event) {
    await autoTranslateIfNeeded(event)
  },
}
