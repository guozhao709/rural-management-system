# servers

Node.js + Express backend service for admin and client frontends.

## Structure

```text
.
|-- data/
|   |-- admin/             # Admin JSON data
|   `-- client/            # Legacy client SQLite data
|-- sql/                   # MySQL schema
|-- docs/                  # Development docs
|-- src/
|   |-- app.js             # Server entry
|   |-- app/               # Route mounting entry modules
|   |-- admin/             # Admin routes and utilities
|   `-- client/            # Client routes, tools, db, prompts
|-- package.json
`-- README.md
```

## Scripts

```bash
npm run dev
npm start
```

## MySQL

Create the database before starting the service:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS zhixiang_cloud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p zhixiang_cloud < sql/schema.sql
```
