
## Goal

1. Editors create/update english content
2. Auto-translate (updated!) fields to other languages via deepl automatically

Trying to use 

- https://www.npmjs.com/package/strapi-plugin-translate
- https://www.npmjs.com/package/strapi-provider-translate-deepl


See

- https://github.com/Fekide/strapi-plugin-translate/issues/512

### Current state

1. First step: Modify updated content in components/relations properly (not even translated yet)

```
[translate] Auto-translate failed for id=1 → zh: Error: insert into `pages` (`created_at`, `created_by_id`, `hero_teaser`, `locale`, `published_at`, `title`, `updated_at`, `updated_by_id`) values ('2025-08-26 12:25:42.056', '{\"id\":1,\"firstname\":\"Arnold\",\"lastname\":\"Admin\",\"username\":null,\"email\":\"admin@example.com\",\"password\":\"xxx",\"resetPasswordToken\":null,\"registrationToken\":null,\"isActive\":true,\"blocked\":false,\"preferedLanguage\":null,\"createdAt\":\"2025-08-26T09:10:17.776Z\",\"updatedAt\":\"2025-08-26T09:10:17.776Z\"}', 'Lorem12 2ipsum dolor sit amet, consetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.因此，我们对他们提出了指控，并对他们进行了公正的审判。Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.Lorem ipsum dolor sit amet, consetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.因此，我们对他们提出了指控，并对他们进行了公正的审判。Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.', 'zh', '2025-08-26 12:29:12.579', '测试', '2025-08-26 12:32:55.441', '{\"id\":1,\"firstname\":\"Arnold\",\"lastname\":\"Admin\",\"username\":null,\"email\":\"admin@example.com\",\"password\":\"xxx\",\"resetPasswordToken\":null,\"registrationToken\":null,\"isActive\":true,\"blocked\":false,\"preferedLanguage\":null,\"createdAt\":\"2025-08-26T09:10:17.776Z\",\"updatedAt\":\"2025-08-26T09:10:17.776Z\"}') - Incorrect integer value: '{"id":1,"firstname":"Arnold","lastname":"Admin","username":null,"email":"admin@example.com","password":"$2a$10$6TyjKg3Nd6vEHk677' for column 'created_by_id' at row 1
```

2. Detect change fields and only translate them (reduce API call cost)
2. Translate (updated) fields



## Local Setup

Local development playground for Strapi v4 with MySQL.

1. `cp .env.example .env`
2. `docker compose build`
3. `docker compose up`
4. Import db dump:

Import database dump: 

```bash
docker compose exec strapiDB sh -c \
  'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" strapi' > dump.sql
```

5. Login to http://localhost:1337/admin/ 

User: `admin@example.com`, pw: `Password1!`

Tested on Mac M processor / Docker Desktop. Make sure to stop other projects with MySQL/DB with `docker compose down`.

6. Add deepl API keys to `.env`

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

See base repository for all details.

Steps for this repo:

- `npm install strapi-plugin-translate`
- add config to `config/plugins.js` 
- `npm i strapi-provider-translate-deepl`
- rebuild & restart `docker compose up --build`
