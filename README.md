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

## Usage

Import database dump: 

```bash
docker compose exec strapiDB sh -c \
  'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" strapi' > dump.sql.gz
```

Restore a database dump:

```bash
docker compose exec -T strapiDB sh -c \
  'mysql -u root -p"$MYSQL_ROOT_PASSWORD" strapi' < dump.sql.gz
```

Install plugins via:

```bash
docker compose exec strapi npm install strapi-plugin-translate

# restart with CRTL + or when detached with docker compose up -d
docker compose down && docker compose up
```
