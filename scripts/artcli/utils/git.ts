import { spawnSync } from "node:child_process";
import { Logger } from "../../logger";
import { context } from "./context";
import { exit } from "./cli";

export interface GitResult {
    success: boolean;
    output: string;
}

export function runGit(args: string[]): GitResult {
    const result = spawnSync("git", args, { encoding: "utf-8" });
    const output = (result.stdout || "") + (result.stderr || "");
    return { success: result.status === 0, output };
}

export async function pushToRemote(
    files: string[],
    commitMessage: string,
): Promise<void> {
    if (context.dryRun) {
        Logger.warning(
            `[DRYRUN] Would stage, commit, and push with message: "${commitMessage}"`,
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
    Logger.success(`Committed: ${Logger.inlineBold(commitMessage)}`);

    Logger.info("Pushing to remote...");
    const pushResult = runGit(["push"]);
    if (!pushResult.success) {
        Logger.error(`git push failed:\n${pushResult.output}`);
        exit(1);
    }
    Logger.success("Pushed to remote.");
}
