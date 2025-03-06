import pgPromise from "pg-promise";
import config from "../config";

const pgp: pgPromise.IMain = pgPromise();

const isTest = process.env.NODE_ENV === "test";

const connectionString = isTest
  ? config.db.connectionStringTest
  : config.db.connectionString;

const db = pgp(connectionString);

const closeConnection = async () => {
  pgp.end();
};

export default db;
export { closeConnection, pgp };
