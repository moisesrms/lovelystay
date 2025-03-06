# Lovelystay - GitHub User Tracker

A command-line application to track GitHub users and their programming languages using Node.js, TypeScript, and PostgreSQL.

## Features

- Fetch GitHub user information and store it in a PostgreSQL database.
- Retrieve all stored users.
- Filter users by location.
- Filter users by programming languages.
- Combine location and language filters.

## Prerequisites

- [Node.js](https://nodejs.org/) (v23.8.0)
- [nvm](https://github.com/nvm-sh/nvm) (optional - if installed, run `nvm use` to use the recommended Node.js version)
- [Docker](https://www.docker.com/)
- [GitHub API Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## Installation

Clone the repository:

```sh
git clone https://github.com/moisesrms/lovelystay.git
cd lovelystay
```

Install dependencies:

```sh
npm install
```

## Running the Application

### Start PostgreSQL with Docker

Ensure Docker is running and execute:
This command will start two PostgreSQL databases:

- `lovelystay` on port 5432 for development/production use
- `lovelystay-test` on port 5433 for running tests

```sh
docker-compose up -d
```

## Environment Variables

Create a `.env` file with:

```
GITHUB_TOKEN=your_personal_access_token
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lovelystay
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/lovelystay
```

### Migrations

The database migrations will be executed automatically when the application starts. The migrations include creating the necessary tables and indexes for storing GitHub user data and their programming languages.

### Run the Application

For development:

```sh
npm run dev -- <command>
```

For production:

```sh
npm run build
npm start -- <command>
```

## CLI Usage

```
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

  -h                                               Show help
```

## Running Tests

### Unit Tests

```sh
npm run test:unit
```

### End-to-End (E2E) Tests

```sh
npm run test:e2e
```

## Code Linting

```sh
npm run lint
```

To automatically fix lint issues:

```sh
npm run lint:fix
```
