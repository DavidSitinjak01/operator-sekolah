const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const dbUrl = process.env.DATABASE_URL || "";

let schema = fs.readFileSync(schemaPath, "utf-8");

if (dbUrl.startsWith("postgresql://")) {
  // PostgreSQL for Vercel (Neon)
  schema = schema.replace(
    /provider\s*=\s*"sqlite"/g,
    'provider = "postgresql"'
  );
  // Add directUrl if using Neon and not already present
  if (!schema.includes("directUrl")) {
    schema = schema.replace(
      /url\s*=\s*env\("DATABASE_URL"\)/,
      'url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
    );
  }
} else {
  // SQLite for local development
  schema = schema.replace(
    /provider\s*=\s*"postgresql"/g,
    'provider = "sqlite"'
  );
  // Remove directUrl for SQLite
  schema = schema.replace(/\s*directUrl\s*=\s*env\("DIRECT_URL"\)\n?/g, "\n");
}

fs.writeFileSync(schemaPath, schema, "utf-8");