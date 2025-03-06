export interface GithubUser {
  login: string;
  name: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  avatar_url: string;
  html_url: string;
  company: string | null;
}

export interface Repository {
  name: string;
  language: string | null;
  languages_url: string;
}

export interface DbUser {
  id: number;
  username: string;
  name: string;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
  avatar_url: string;
  html_url: string;
  company: string | null;
}

export interface DbLanguage {
  id: number;
  name: string;
}

export interface DbUserLanguage {
  user_id: number;
  language_id: number;
}

export interface UserWithLanguages extends DbUser {
  languages: string[];
} 