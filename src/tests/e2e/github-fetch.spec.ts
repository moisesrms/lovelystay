import nock from "nock";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanup } from "../../db/cleanup";
import runMigrations from "../../db/migrations";
import languageRepo from "../../db/repos/languages";
import userRepo from "../../db/repos/users";
import { fetchAndStoreUser } from "../../services/cli";

const mockUser = {
  login: "testuser",
  id: 12345,
  name: "Test User",
  bio: "GitHub test user",
  location: "Test Location",
  company: "Test Company",
  blog: "https://test.com",
  email: "test@example.com",
  twitter_username: "testuser",
  followers: 100,
  following: 50,
  public_repos: 20,
  public_gists: 5,
  html_url: "https://github.com/testuser",
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockRepos = [
  {
    id: 1,
    name: "test-repo-1",
    language: "JavaScript",
    languages_url:
      "https://api.github.com/repos/testuser/test-repo-1/languages",
    html_url: "https://github.com/testuser/test-repo-1",
  },
  {
    id: 2,
    name: "test-repo-2",
    language: "TypeScript",
    languages_url:
      "https://api.github.com/repos/testuser/test-repo-2/languages",
    html_url: "https://github.com/testuser/test-repo-2",
  },
];

const mockLanguages1 = {
  JavaScript: 10000,
  HTML: 5000,
  CSS: 3000,
};

const mockLanguages2 = {
  TypeScript: 20000,
  JavaScript: 5000,
};

describe("GitHub User Fetch E2E", () => {
  beforeAll(async () => {
    nock.disableNetConnect();
    try {
      await runMigrations();
      console.log("Database migrations completed successfully.");
    } catch (error) {
      console.error("Failed to set up test database:", error);
      throw error;
    }
  });

  afterAll(async () => {
    console.log("Cleaning up test environment...");
    try {
      await cleanup();
    } catch (error) {
      console.error("Error during test cleanup:", error);
    }

    nock.enableNetConnect();
    nock.cleanAll();
  });

  beforeEach(() => {
    nock.cleanAll();

    nock("https://api.github.com")
      .get("/users/testuser")
      .query(true)
      .reply(200, mockUser);

    nock("https://api.github.com")
      .get("/users/testuser/repos")
      .query(true)
      .reply(200, mockRepos);

    nock("https://api.github.com")
      .get("/repos/testuser/test-repo-1/languages")
      .query(true)
      .reply(200, mockLanguages1);

    nock("https://api.github.com")
      .get("/repos/testuser/test-repo-2/languages")
      .query(true)
      .reply(200, mockLanguages2);

    nock("https://api.github.com")
      .get("/users/nonexistentuser")
      .query(true)
      .reply(404);
  });

  it("should fetch GitHub user data and store it in the database", async () => {
    await fetchAndStoreUser("testuser");

    const savedUser = await userRepo.findByUsername("testuser");
    expect(savedUser).toBeTruthy();
    expect(savedUser?.username).toBe("testuser");
    expect(savedUser?.name).toBe("Test User");
    expect(savedUser?.location).toBe("Test Location");

    const languages = await languageRepo.getUserLanguages(savedUser!.id);
    expect(languages).toHaveLength(4);
    expect(languages).toContain("JavaScript");
    expect(languages).toContain("TypeScript");
    expect(languages).toContain("HTML");
    expect(languages).toContain("CSS");
  });

  it("should handle non-existent GitHub users", async () => {
    await expect(fetchAndStoreUser("nonexistentuser")).resolves.not.toThrow();

    const savedUser = await userRepo.findByUsername("nonexistentuser");
    expect(savedUser).toBeNull();
  });

  it("should list all users stored in the database", async () => {
    await userRepo.deleteAll();

    await fetchAndStoreUser("testuser");

    const secondUser = {
      ...mockUser,
      login: "seconduser",
      id: 67890,
      name: "Second User",
    };

    nock("https://api.github.com")
      .get("/users/seconduser")
      .query(true)
      .reply(200, secondUser);

    nock("https://api.github.com")
      .get("/users/seconduser/repos")
      .query(true)
      .reply(
        200,
        mockRepos.map((repo) => ({
          ...repo,
          name: `second-${repo.name}`,
          languages_url:
            `https://api.github.com/repos/seconduser` +
            `/second-${repo.name}/languages`,
        }))
      );

    nock("https://api.github.com")
      .get("/repos/seconduser/second-test-repo-1/languages")
      .query(true)
      .reply(200, mockLanguages1);

    nock("https://api.github.com")
      .get("/repos/seconduser/second-test-repo-2/languages")
      .query(true)
      .reply(200, mockLanguages2);

    await fetchAndStoreUser("seconduser");

    const users = await userRepo.getAllUsers();
    expect(users).toHaveLength(2);
    expect(users.map((u) => u.username)).toContain("testuser");
    expect(users.map((u) => u.username)).toContain("seconduser");
  });

  it("should list users filtered by language", async () => {
    await userRepo.deleteAll();
    await fetchAndStoreUser("testuser");

    const typescriptUsers = await userRepo.getUsersWithLanguages({
      languages: ["TypeScript"],
    });
    expect(typescriptUsers).toHaveLength(1);
    expect(typescriptUsers[0].username).toBe("testuser");

    const rubyUsers = await userRepo.getUsersWithLanguages({
      languages: ["Ruby"],
    });
    expect(rubyUsers).toHaveLength(0);
  });

  it("should list users filtered by location", async () => {
    await userRepo.deleteAll();
    await fetchAndStoreUser("testuser");

    const locationUsers = await userRepo.getUsersWithLanguages({
      location: "Test Location",
    });
    expect(locationUsers).toHaveLength(1);
    expect(locationUsers[0].username).toBe("testuser");

    const nonExistentLocationUsers = await userRepo.getUsersWithLanguages({
      location: "Non Existent Location",
    });
    expect(nonExistentLocationUsers).toHaveLength(0);
  });
});
