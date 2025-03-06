import { DbUser, GithubUser, UserWithLanguages } from "../../types";
import db from "../index";

const getValuesPlaceholder = (columns: string[], startIdx = 1): string => {
  return columns.map((_, i) => `$${i + startIdx}`).join(", ");
};

const saveUser = async (user: GithubUser): Promise<number> => {
  const columns = [
    "username",
    "name",
    "location",
    "bio",
    "public_repos",
    "followers",
    "following",
    "created_at",
    "updated_at",
    "avatar_url",
    "html_url",
    "company",
  ];

  const values = [
    user.login,
    user.name || user.login,
    user.location,
    user.bio,
    user.public_repos,
    user.followers,
    user.following,
    user.created_at,
    user.updated_at,
    user.avatar_url,
    user.html_url,
    user.company,
  ];

  const query = `
    INSERT INTO users(${columns.join(", ")})
    VALUES(${getValuesPlaceholder(columns)})
    ON CONFLICT (username)
    DO UPDATE SET
      name = EXCLUDED.name,
      location = EXCLUDED.location,
      bio = EXCLUDED.bio,
      public_repos = EXCLUDED.public_repos,
      followers = EXCLUDED.followers,
      following = EXCLUDED.following,
      updated_at = EXCLUDED.updated_at,
      avatar_url = EXCLUDED.avatar_url,
      html_url = EXCLUDED.html_url,
      company = EXCLUDED.company,
      fetched_at = NOW()
    RETURNING id
  `;

  return db.one(query, values).then((result) => result.id);
};

const findByUsername = async (username: string): Promise<DbUser | null> => {
  return db.oneOrNone("SELECT * FROM users WHERE username = $1", [username]);
};

const getAllUsers = async (): Promise<DbUser[]> => {
  return db.any("SELECT * FROM users ORDER BY username");
};

const getUsersByLocation = async (location: string): Promise<DbUser[]> => {
  return db.any(
    "SELECT * FROM users WHERE LOWER(location) LIKE LOWER($1) " +
      "ORDER BY username",
    [`%${location}%`]
  );
};

const getUsersWithLanguages = async ({
  location,
  languages,
}: {
  location?: string;
  languages?: string[];
}): Promise<UserWithLanguages[]> => {
  let query = `
    SELECT u.*, ARRAY_AGG(DISTINCT l.name) as languages
    FROM users u
    LEFT JOIN user_languages ul ON u.id = ul.user_id
    LEFT JOIN languages l ON ul.language_id = l.id
  `;

  const whereConditions: string[] = [];
  const params: any[] = [];
  let paramCounter = 1;

  if (location) {
    whereConditions.push(`LOWER(u.location) LIKE LOWER($${paramCounter})`);

    params.push(`%${location}%`);
    paramCounter++;
  }

  if (languages && languages.length > 0) {
    const placeholders = languages
      .map((_, index) => `$${paramCounter + index}`)
      .join(", ");

    whereConditions.push(`
      EXISTS (
        SELECT 1 FROM user_languages ul2
        JOIN languages l2 ON ul2.language_id = l2.id
        WHERE ul2.user_id = u.id AND LOWER(l2.name) IN (${placeholders})
      )
    `);

    languages.forEach((lang) => {
      params.push(lang.toLowerCase());
    });

    paramCounter += languages.length;
  }

  if (whereConditions.length > 0) {
    query += " WHERE " + whereConditions.join(" AND ");
  }

  query += " GROUP BY u.id ORDER BY u.username";

  return db.any(query, params);
};

const deleteAll = async () => {
  return db.none("DELETE FROM users");
};

export default {
  saveUser,
  findByUsername,
  getAllUsers,
  getUsersByLocation,
  getUsersWithLanguages,
  deleteAll,
};
