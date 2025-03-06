import axios, { AxiosResponse } from "axios";
import config from "../config";
import { GithubUser, Repository } from "../types";

// Create a configured axios instance
const githubApi = axios.create({
  baseURL: config.github.apiUrl,
  headers: {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "lovelystay",
    ...(config.github.token
      ? { Authorization: `token ${config.github.token}` }
      : {}),
  },
});

// Get user information from GitHub
const getUser = async (username: string): Promise<GithubUser | null> => {
  try {
    const response = await githubApi.get(`/users/${username}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Parse GitHub API pagination links from the Link header
const parseLinkHeader = (
  linkHeader: string | undefined
): Record<string, string> => {
  if (!linkHeader) return {};

  const links: Record<string, string> = {};
  const parts = linkHeader.split(",");

  for (const part of parts) {
    const section = part.split(";");
    if (section.length !== 2) continue;

    // Extracts URL from format '<https://api.github.com/...>'
    // to 'https://api.github.com/...'
    const url = section[0].trim().replace(/<(.+)>/, "$1");

    // Extracts rel from format 'rel="next"' to 'next'
    const name = section[1].trim().replace(/rel="(.+)"/, "$1");

    links[name] = url;
  }

  return links;
};

// Get user repositories with pagination support
const getUserRepositories = async (username: string): Promise<Repository[]> => {
  try {
    // Make initial request to get first page and pagination info
    const firstPageResponse = await githubApi.get(
      `/users/${username}/repos?per_page=100&sort=updated`
    );
    const firstPageRepos: Repository[] = [...firstPageResponse.data];
    let allRepos: Repository[] = [...firstPageRepos];

    // Parse pagination links
    const linkHeader = firstPageResponse.headers.link;
    const links = parseLinkHeader(linkHeader);

    // If there are more pages, fetch them in parallel
    if (links.last) {
      // Create an array of promises for remaining pages
      const pagePromises = [];
      let nextUrl = links.next;

      while (nextUrl) {
        const relativeUrl = nextUrl.replace(config.github.apiUrl, "");
        pagePromises.push(githubApi.get(relativeUrl));

        // Get next URL if available
        const currentLinks = parseLinkHeader(nextUrl);
        nextUrl = currentLinks.next;
      }

      // Fetch all remaining pages in parallel
      const results = await Promise.allSettled(pagePromises);

      // Process successful responses
      const remainingRepos = results
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<AxiosResponse<Repository[]>> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value.data)
        .flat();

      // Combine with initial results
      allRepos = [...firstPageRepos, ...remainingRepos];
    }

    return allRepos;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

// Get repository languages in parallel
const getRepositoryLanguages = async (repo: Repository): Promise<string[]> => {
  try {
    if (!repo.languages_url) return [];

    const response = await githubApi.get(repo.languages_url);
    // Languages endpoint returns an object with language names as keys
    return Object.keys(response.data);
  } catch (error) {
    console.error(`Error fetching languages for ${repo.name}:`, error);
    return [];
  }
};

// Get programming languages used by a user with parallel processing
const getUserLanguages = async (username: string): Promise<string[]> => {
  const repos = await getUserRepositories(username);

  // Process repository language data in parallel
  const languagePromises = repos.map(async (repo) => {
    // First try the language property which is the primary language
    const primaryLanguage = repo.language ? [repo.language] : [];

    // Then fetch all languages for each repository in parallel
    const repoLanguages = await getRepositoryLanguages(repo);

    return [...primaryLanguage, ...repoLanguages];
  });

  // Wait for all language requests to complete using Promise.allSettled
  const results = await Promise.allSettled(languagePromises);

  // Extract values from fulfilled promises only
  const nestedLanguages = results
    .filter(
      (result): result is PromiseFulfilledResult<string[]> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

  // Flatten array and remove duplicates
  const allLanguages = nestedLanguages.flat();
  const uniqueLanguages = [...new Set(allLanguages)].filter(
    (lang) => lang !== null
  );

  return uniqueLanguages;
};

export default {
  getUser,
  getUserRepositories,
  getUserLanguages,
  // Export for testing
  parseLinkHeader,
};
