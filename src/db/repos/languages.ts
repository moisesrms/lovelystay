import db from "../index";

// Save a language and return its ID
const saveLanguage = async (name: string): Promise<number> => {
  const query = `
    INSERT INTO languages(name)
    VALUES($(name))
    ON CONFLICT (name) DO UPDATE
    SET name = $(name)
    RETURNING id
  `;

  return db.one(query, { name }).then((result) => result.id);
};

// Associate a language with a user
const linkUserToLanguage = async (
  userId: number,
  languageId: number
): Promise<void> => {
  const query = `
    INSERT INTO user_languages(user_id, language_id)
    VALUES($(userId), $(languageId))
    ON CONFLICT (user_id, language_id) DO NOTHING
  `;

  await db.none(query, { userId, languageId });
};

const unlinkAllLanguagesFromUser = async (userId: number): Promise<void> => {
  const query = `
    DELETE FROM user_languages
    WHERE user_id = $(userId)
  `;

  await db.none(query, { userId });
};

// Save multiple languages and link them to a user
const saveUserLanguages = async (
  userId: number,
  languages: string[]
): Promise<void> => {
  // Filter empty languages and deduplicate
  const validLanguages = [...new Set(languages.filter((language) => Boolean(language)))];

  if (validLanguages.length === 0) {
    return;
  }

  // Save each language and get their IDs
  const languageResults = await Promise.allSettled(
    validLanguages.map((lang) => saveLanguage(lang))
  );

  const languageIds = languageResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<number>).value);

  // Link each language to the user
  await Promise.allSettled(
    languageIds.map((langId) => linkUserToLanguage(userId, langId))
  );
};

// Get all languages
const getAllLanguages = async (): Promise<string[]> => {
  return db.map(
    "SELECT name FROM languages ORDER BY name",
    [],
    (result) => result.name
  );
};

// Get all languages for a specific user
const getUserLanguages = async (userId: number): Promise<string[]> => {
  const query = `
    SELECT l.name
    FROM languages l
    JOIN user_languages ul ON l.id = ul.language_id
    WHERE ul.user_id = $(userId)
    ORDER BY l.name
  `;

  return db.map(query, { userId }, (result) => result.name);
};

export default {
  saveLanguage,
  linkUserToLanguage,
  saveUserLanguages,
  getAllLanguages,
  getUserLanguages,
  unlinkAllLanguagesFromUser
};