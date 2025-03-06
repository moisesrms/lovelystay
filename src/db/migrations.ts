import * as fs from "fs";
import * as path from "path";
import db from "./index";

const runMigrations = async () => {
  try {
    // Create migrations table if it doesn't exist
    await db.none(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Get applied migrations
    const appliedMigrations = await db.map(
      "SELECT name FROM migrations",
      [],
      (row: { name: string }) => row.name
    );

    // Get all migration files
    const migrationsDir = path.join(__dirname, "../../migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    // Filter out migrations that need to be applied using native JavaScript
    const pendingMigrations = migrationFiles.filter(
      (file) => !appliedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      return;
    }

    // Apply each migration in a transaction
    await db.tx(async (t) => {
      for (const migrationFile of pendingMigrations) {
        const filePath = path.join(migrationsDir, migrationFile);
        const sql = fs.readFileSync(filePath, "utf8");

        console.log(`Applying migration: ${migrationFile}`);
        await t.none(sql);
        await t.none("INSERT INTO migrations(name) VALUES($1)", migrationFile);
      }
    });

    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
};

export default runMigrations;
