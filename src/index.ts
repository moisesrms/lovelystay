import minimist from "minimist";
import { validateInput } from "./argsSchema";
import { closeConnection } from "./db";
import runMigrations from "./db/migrations";
import { printHelp, routeCliCommand } from "./services/cli";

const main = async (): Promise<void> => {
  await runMigrations();

  const args = minimist(process.argv.slice(2));
  const validatedArgs = validateInput(args);
  if (validatedArgs && validatedArgs.success) {
    await routeCliCommand(validatedArgs.data);
  } else {
    console.error(
      "Invalid arguments:",
      validatedArgs?.error?.errors.map((e) => e.message)
    );
    printHelp();
  }
};

main()
  .then(() => {
    closeConnection();
  })
  .catch((error) => {
    console.error(error);
    printHelp();
  });
