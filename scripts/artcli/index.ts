// ECHOLOTL ARTCLI
// The command-line tool used to manage art assets and metadata for echolotl.lol

import { Logger } from "../logger";
import { context } from "./utils/context";
import { printUsage, exit } from "./utils/cli";
import { add } from "./commands/add";

async function main() {
    const argv = process.argv.slice(2).filter((arg) => {
        if (arg === "--dry-run") {
            context.dryRun = true;
            return false;
        }
        if (arg === "--push") {
            context.shouldPush = true;
            return false;
        }
        if (arg === "--help" || arg === "-h") {
            printUsage();
            exit(0);
        }
        return true;
    });
    if (context.dryRun)
        Logger.warning("Running in dry-run mode. No files will be written.");
    const [command, ...args] = argv;
    switch (command) {
        case "add":
            await add(args);
            break;
        default:
            printUsage();
            exit(0);
    }
}

main();
