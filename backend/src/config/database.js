require('dotenv').config();

// Parse DATABASE_URL
const parseDatabaseUrl = (url) => {
  const parsed = new URL(url);
  return {
    username: parsed.username,
    password: parsed.password,
    host: parsed.hostname,
    port: parsed.port,
    database: parsed.pathname.slice(1), // Remove leading slash
    dialect: 'postgres'
  };
};

const dbConfig = process.env.DATABASE_URL ? parseDatabaseUrl(process.env.DATABASE_URL) : {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'facturacion',
  dialect: 'postgres'
};

module.exports = {
  development: {
    ...dbConfig,
    logging: console.log
  },
  production: {
    ...dbConfig,
    logging: false,
    dialectOptions: {
      ssl: false
    }
  }
};
