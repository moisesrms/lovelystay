-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  bio TEXT,
  public_repos INTEGER NOT NULL DEFAULT 0,
  followers INTEGER NOT NULL DEFAULT 0,
  following INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  avatar_url TEXT,
  html_url TEXT NOT NULL,
  company VARCHAR(255),
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create languages table
CREATE TABLE IF NOT EXISTS languages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Create junction table for users and languages
CREATE TABLE IF NOT EXISTS user_languages (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, language_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_user_languages_user_id ON user_languages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_language_id ON user_languages(language_id); 