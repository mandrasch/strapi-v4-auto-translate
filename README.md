
## Goal

1. Editors create/update english content
2. Auto-translate (updated!) fields to other languages via deepl automatically

Trying to use 

- https://www.npmjs.com/package/strapi-plugin-translate
- https://www.npmjs.com/package/strapi-provider-translate-deepl

See as well:

- https://github.com/Fekide/strapi-plugin-translate/issues/284
- https://github.com/Fekide/strapi-plugin-translate/discussions/283

### Current state

Trying to use service of strapi plugin auto translate in lifecycle.

**Current problem: create works, but update does not.**

```js
  for (const targetLocale of targetLocales) {
  console.log(`\n🔄 Starting translation for ${targetLocale}...`);

  const batchResult = await translateService.batchTranslate({
    sourceLocale: 'en',
    targetLocale: targetLocale,
    contentType: contentTypeUid,
    entityIds: [result.id],
    autoPublish: true
  });
```

## Old state - lifecycle manual try (not working)

See https://github.com/mandrasch/strapi-v4-auto-translate/tree/try-v1

## Local Setup

Local development playground for Strapi v4 with MySQL.

1. `cp .env.example .env`
2. `docker compose build`
3. `docker compose up`
4. Import db dump:

Import database dump: 

```bash
docker compose exec -T strapiDB sh -c \
  'mysql -u root -p"$MYSQL_ROOT_PASSWORD" strapi' < dump.sql.gz
```

5. Login to http://localhost:1337/admin/ 

User: `admin@example.com`, pw: `Password1!`

6. In future, not yet: Add deepl API keys to `.env`

## Usage

### Import database dump: 

```bash
docker compose exec strapiDB sh -c \
  'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" strapi' > dump.sql.gz
```

### Restore a database dump:

```bash
docker compose exec -T strapiDB sh -c \
  'mysql -u root -p"$MYSQL_ROOT_PASSWORD" strapi' < dump.sql.gz
```

### Install plugins via:

1. Update `package.json` with new package, e.g. `npm install strapi-plugin-translate` locally
2. restart with CRTL+c / `docker compose down` and 

```bash
# (runs `npm i` in Dockerfile)
docker compose up --build

# or
docker compose build
docker compose up
```

TODO: Better approach, do it with `docker compose exex strapi ...`, but mount can't be only for package.json?!

## How was this created?

See base repository template for all details.

Steps for this repo:

- `npm install strapi-plugin-translate`
- add config to `config/plugins.js` 
- `npm i strapi-provider-translate-deepl`
- rebuild & restart `docker compose up --build`
