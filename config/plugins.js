module.exports = () => ({
   translate: {
    enabled: true,
    config: {
      provider: 'deepl',
      providerOptions: {
        localeMap: {
          EN: 'EN-US',
        },
        apiOptions: {
          formality: 'default',
          preserveFormatting: true,
        },
      },
    },
  },
});
