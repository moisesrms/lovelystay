import * as dotenv from "dotenv";

dotenv.config();

const config = {
  db: {
    connectionString:
      process.env.DATABASE_URL ||
      "postgres://postgres:postgres@localhost:5432/lovelystay",
    connectionStringTest:
      process.env.DATABASE_URL_TEST ||
      "postgresql://postgres:postgres@localhost:5433/lovelystay_test",
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
    apiUrl: "https://api.github.com",
  },
};

export default config;
