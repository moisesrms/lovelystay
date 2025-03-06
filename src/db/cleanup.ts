import db from "./index";
const cleanup = async () => {
  try {
    await db.none(`
      -- Temporarily disable constraints for cleanup
      SET session_replication_role = 'replica';

      -- Drop all tables
      DROP TABLE IF EXISTS migrations;
      DROP TABLE IF EXISTS user_repositories;
      DROP TABLE IF EXISTS user_languages;
      DROP TABLE IF EXISTS languages;
      DROP TABLE IF EXISTS repositories;
      DROP TABLE IF EXISTS users;

      -- Re-enable constraints
      SET session_replication_role = 'origin';
    `);
  } catch (error) {
    console.error("Failed to cleanup tables:", error);
    throw error;
  }
};

export { cleanup };
