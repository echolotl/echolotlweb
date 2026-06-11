import { spawnSync } from "node:child_process";
import { Logger } from "../../logger";
import { context } from "./context";
import { exit } from "./cli";

export interface GitResult {
  success: boolean;
  output: string;
}

/**
 * Constructs git command arguments to set the user name and email for commits, based on environment variables.
 * This allows for commits to be attributed to a specific bot identity if provided.
 * This only works with GitHub's application installation accounts, which use a specific email format.
 * @returns An array of git command arguments to set the user name and email, or an empty array if no name is provided.
 */
function getBotIdentityArgs(): string[] {
  const name = process.env.ARTCLI_GIT_NAME;
  const appId = process.env.ARTCLI_GITHUB_APP_ID;
  const args: string[] = [];

  if (name) {
    args.push("-c", `user.name=${name}`);

    if (appId) {
      args.push("-c", `user.email=${appId}+${name}@users.noreply.github.com`);
    }
  }

  return args;
}

/**
 * Spawns a git process with the provided arguments.
 * @param args Array of git command arguments
 * @returns Result of the git command execution, including success status and output
 */
export function runGit(args: string[]): GitResult {
  const result = spawnSync("git", [...getBotIdentityArgs(), ...args], {
    encoding: "utf-8",
  });
  const output = (result.stdout || "") + (result.stderr || "");
  return { success: result.status === 0, output };
}

/**
 * Pushes selected files to the remote repository with a commit message.
 * @param files Array of file paths to stage and commit
 * @param commitMessage Commit message for the changes
 * @returns Promise that resolves when the push is complete, or exits the process on failure
 */
export async function pushToRemote(files: string[], commitMessage: string): Promise<void> {
  const name = process.env.ARTCLI_GIT_NAME;
  const appId = process.env.ARTCLI_GITHUB_APP_ID;
  if (context.dryRun) {
    Logger.warning(
      `[DRYRUN] Would stage, commit, and push${name ? ` as ${name}${appId ? ` <${appId}+${name}@users.noreply.github.com>` : ""}` : ""} with message: "${commitMessage}"`,
    );
    return;
  }
  Logger.nl();
  Logger.info("Staging changes...");

  const addResult = runGit(["add", ...files]);
  if (!addResult.success) {
    Logger.error(`git add failed:\n${addResult.output}`);
    exit(1);
  }

  const commitResult = runGit(["commit", "-m", commitMessage]);
  if (!commitResult.success) {
    Logger.error(`git commit failed:\n${commitResult.output}`);
    exit(1);
  }
  Logger.success(`Committed: ${Logger.fmtBold(commitMessage)}`);

  Logger.info("Pushing to remote...");
  const pushResult = runGit(["push"]);
  if (!pushResult.success) {
    Logger.error(`git push failed:\n${pushResult.output}`);
    exit(1);
  }
  Logger.success("Pushed to remote.");
}
