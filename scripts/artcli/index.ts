// ECHOLOTL ARTCLI
// The command-line tool used to manage art assets and metadata for echolotl.lol

import { Logger } from "../logger";
import { context } from "./utils/context";
import { printUsage, exit } from "./utils/cli";
import { add } from "./commands/add";
import { append } from "./commands/append";
import { update } from "./commands/update";
import { remove } from "./commands/remove";
import { del } from "./commands/delete";
import { list } from "./commands/list";
import { show } from "./commands/show";
import { regenthumb } from "./commands/regenthumb";
import { regenpalette } from "./commands/regenpalette";

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
        case "append":
            await append(args);
            break;
        case "update":
            await update(args);
            break;
        case "remove":
            await remove(args);
            break;
        case "delete":
            await del(args);
            break;
        case "list":
            await list(args);
            break;
        case "show":
            await show(args);
            break;
        case "regenthumb":
            await regenthumb(args);
            break;
        case "regenpalette":
            await regenpalette(args);
            break;
        default:
            printUsage();
            exit(0);
    }
}

main();
