import { ArgsType, ListArgsType } from "../argsSchema";
import languageRepo from "../db/repos/languages";
import userRepo from "../db/repos/users";
import { GithubUser, UserWithLanguages } from "../types";
import githubService from "./github";

export const routeCliCommand = async (args: ArgsType) => {
  switch (args.command) {
    case "fetch":
      await fetchAndStoreUser(args.name);
      break;
    case "list":
      await list(args);

      break;
    default:
      printHelp();
  }
};

const list = async (args: ListArgsType) => {
  if (args.location && args.languages) {
    await listUsersByLocationAndLanguage(args.location, args.languages);
  } else if (args.location) {
    await listUsersByLocation(args.location);
  } else if (args.languages) {
    await listUsersByLanguage(args.languages);
  } else {
    await listAllUsers();
  }
};

const logUsersSummary = (users: UserWithLanguages[]): void => {
  const tableData = users.map((user) => {
    const languages = user.languages?.filter(Boolean).join(", ") || "None";

    return {
      Username: user.username,
      Name: user.name,
      Location: user.location || "Not specified",
      Languages: languages,
      PublicRepos: user.public_repos,
      Followers: user.followers,
      Following: user.following,
      Profile: user.html_url,
    };
  });

  console.group(tableData);
};

const fetchUser = async (username: string): Promise<GithubUser | null> => {
  try {
    const user = await githubService.getUser(username);
    if (!user) {
      console.info(`User ${username} not found`);
      return null;
    }
    return user;
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error);
    throw error;
  }
};

const fetchAndStoreUser = async (username: string): Promise<void> => {
  try {
    console.log(`Fetching user ${username} from GitHub...`);

    const user = await githubService.getUser(username);
    if (!user) {
      console.info(`User ${username} not found`);
      return;
    }

    const userId = await userRepo.saveUser(user);

    if (!userId) {
      return;
    }

    console.log(`Fetching repositories for ${username}...`);
    const languages = await githubService.getUserLanguages(username);

    if (languages.length > 0) {
      console.log(`Found ${languages.length} languages`);
      await languageRepo.unlinkAllLanguagesFromUser(userId);
      await languageRepo.saveUserLanguages(userId, languages);
    } else {
      console.log("No programming languages found.");
    }

    console.log(
      `User ${username} has been saved to the database ` +
      `with ${languages.length} programming languages.`
    );
  } catch (error) {
    console.error(`Error fetching and storing user ${username}:`, error);
    throw error;
  }
};

const listAllUsers = async (): Promise<void> => {
  try {
    const users = await userRepo.getUsersWithLanguages({});

    if (users.length === 0) {
      console.log("No users found in the database.");
      return;
    }

    console.log(`Found ${users.length} users:\n`);
    logUsersSummary(users);
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

const listUsersByLocation = async (location: string): Promise<void> => {
  try {
    const users = await userRepo.getUsersWithLanguages({ location });

    if (users.length === 0) {
      console.log(`No users found with location matching "${location}".`);
      return;
    }

    console.log(
      `Found ${users.length} users with location matching "${location}":\n`
    );
    logUsersSummary(users);
  } catch (error) {
    console.error(`Error listing users by location "${location}":`, error);
    throw error;
  }
};

const listUsersByLanguage = async (languages: string[]): Promise<void> => {
  try {
    const users = await userRepo.getUsersWithLanguages({ languages });

    if (users.length === 0) {
      console.log(`No users found who use ${languages.join(", ")}.`);
      return;
    }

    console.log(
      `Found ${users.length} users who use ${languages.join(", ")}:\n`
    );
    logUsersSummary(users);
  } catch (error) {
    console.error(
      `Error listing users by language "${languages.join(", ")}":`,
      error
    );
    throw error;
  }
};

const listUsersByLocationAndLanguage = async (
  location: string,
  languages: string[]
): Promise<void> => {
  try {
    const users = await userRepo.getUsersWithLanguages({ location, languages });

    if (users.length === 0) {
      console.log(
        `No users found with location matching` +
        `"${location}" who use ${languages.join(", ")}.`
      );
      return;
    }

    console.log(
      `Found ${users.length
      } users with location matching "${location}" who use ${languages.join(
        ","
      )}:\n`
    );
    logUsersSummary(users);
  } catch (error) {
    console.error(
      `Error listing users by location ` +
      `"${location}" and language ` +
      `"${languages.join(",")}":`,
      error
    );
    throw error;
  }
};

const printHelp = (): void => {
  console.log(`
GitHub User Tracker
Track GitHub users and their programming languages

Commands:
  -f --name <username>                             Fetch a GitHub user

  -l                                               List all users from the db

  -l --location <location>                         List by location
      Note: For locations with multiple words, use quotes (e.g. "New York")

  -l --languages <languages>                       List by language
      Note: For multiple languages, use commas (e.g. "C#, Python")

  -l --location <location> --languages <languages> List by location & languages

  -h                                               Show this help message
`);
};

export {
  fetchAndStoreUser,
  fetchUser,
  listAllUsers,
  listUsersByLanguage,
  listUsersByLocation,
  listUsersByLocationAndLanguage,
  printHelp
};

