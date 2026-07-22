/**
 * Prisma preparation script for dual-environment support.
 *
 * - Local development (no VERCEL env): uses SQLite (schema as-is)
 * - Vercel deployment (VERCEL env): auto-switches schema to PostgreSQL
 *   with Neon-compatible connection pooling, and pushes the schema.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");

const isVercel = !!process.env.VERCEL;

if (isVercel) {
  console.log("[prepare-prisma] Vercel environment detected");

  // Switch to PostgreSQL if needed
  if (schema.includes('provider = "sqlite"')) {
    console.log("[prepare-prisma] Switching schema provider to PostgreSQL...");
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
  }

  // Add directUrl for Neon connection pooling (schema push needs direct connection)
  const datasourceBlock = 'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}';
  const datasourceWithDirect = 'datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}';

  if (!schema.includes("directUrl")) {
    schema = schema.replace(datasourceBlock, datasourceWithDirect);
    console.log("[prepare-prisma] Added directUrl for Neon compatibility");
  }

  fs.writeFileSync(schemaPath, schema);
  console.log("[prepare-prisma] Schema configured for PostgreSQL + Neon");

  // Generate Prisma Client for PostgreSQL
  console.log("[prepare-prisma] Generating Prisma Client...");
  execSync("npx prisma generate", { stdio: "inherit", env: { ...process.env } });

  // Push schema to create/update tables
  // For Neon, use DIRECT_URL (direct connection) for schema push
  console.log("[prepare-prisma] Pushing schema to database...");
  const pushEnv = { ...process.env };
  if (pushEnv.DIRECT_URL) {
    // Use direct URL for schema push (Neon requires this for DDL operations)
    pushEnv.DATABASE_URL = pushEnv.DIRECT_URL;
  }
  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      stdio: "inherit",
      env: pushEnv,
    });
    console.log("[prepare-prisma] Schema pushed successfully");
  } catch (e) {
    console.error("[prepare-prisma] Failed to push schema:", e.message);
    console.log("[prepare-prisma] Continuing with build...");
  }
} else {
  console.log("[prepare-prisma] Local environment detected, using SQLite");
  execSync("npx prisma generate", { stdio: "inherit", env: { ...process.env } });
}

console.log("[prepare-prisma] Done!");