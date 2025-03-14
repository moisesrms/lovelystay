import { DbUser, GithubUser, UserWithLanguages } from "../../types";
import db from "../index";

const saveUser = async (user: GithubUser): Promise<number | null> => {
  if (!user.login) {
    return null
  }

  const query = `
    INSERT INTO users(
      username, name, location, bio, public_repos, 
      followers, following, created_at, updated_at, 
      avatar_url, html_url, company
    )
    VALUES(
      $(username), $(name), $(location), $(bio), $(publicRepos),
      $(followers), $(following), $(createdAt), $(updatedAt),
      $(avatarUrl), $(htmlUrl), $(company)
    )
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

  try {
    const result = await db.one(query, {
      username: user.login,
      name: user.name || user.login,
      location: user.location,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      avatarUrl: user.avatar_url,
      htmlUrl: user.html_url,
      company: user.company
    });
    return result.id;
  } catch (error) {
    console.error("Failed to save user:", error);
    return null
  }
};

const findByUsername = async (username: string): Promise<DbUser | null> => {
  return db.oneOrNone("SELECT * FROM users WHERE username " +
    "= $(username)", { username });
};

const getAllUsers = async (): Promise<DbUser[]> => {
  return db.any("SELECT * FROM users ORDER BY username");
};

const getUsersByLocation = async (location: string): Promise<DbUser[]> => {
  return db.any(
    "SELECT * FROM users WHERE LOWER(location) " +
    "LIKE LOWER($(locationPattern)) " +
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
  const params: any = {};

  if (location) {
    whereConditions.push("LOWER(u.location) LIKE LOWER($(locationPattern))");
    params.locationPattern = `%${location}%`;
  }

  if (languages && languages.length > 0) {
    whereConditions.push(`
      EXISTS (
        SELECT 1 FROM user_languages ul2
        JOIN languages l2 ON ul2.language_id = l2.id
        WHERE ul2.user_id = u.id AND LOWER(l2.name) IN ($(languages:csv))
      )
    `);

    // Convert languages to lowercase
    params.languages = languages.map(lang => lang.toLowerCase());
  }

  if (whereConditions.length > 0) {
    query += " WHERE " + whereConditions.join(" AND ");
  }

  query += " GROUP BY u.id ORDER BY u.username";

  try {
    return db.any(query, params);
  } catch (error) {
    console.error("Failed to get users with languages:", error);
    return [];
  }
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
  deleteAll
};
