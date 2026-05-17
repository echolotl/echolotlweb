import { Logger } from "../../logger";
import { createInterface } from "node:readline/promises";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

export function printUsage() {
    function section(title: string) {
        Logger.log(
            Logger.inlineBold(
                Logger.inlineColor("#da39a4", title.toUpperCase()),
            ),
        );
    }

    Logger.log(`echolotl ARTCLI help\n`);

    section("COMMANDS");
    Logger.statement("add <image-paths...>");
    Logger.dim(
        "Adds a new piece of art with the specified image through an interactive questionnaire.",
    );

    Logger.statement("append <art-slug> <image-paths...> [--variant]");
    Logger.dim("Appends images to an existing piece of art.");

    Logger.statement("update <art-slug>");
    Logger.dim(
        "Updates metadata for an existing piece of art through an interactive questionnaire.",
    );

    Logger.statement("remove <art-slug> [--variant]");
    Logger.dim(
        "Interactively selects an image to remove from an existing piece of art.",
    );

    Logger.statement("delete <art-slug>");
    Logger.dim(
        "Deletes an existing piece of art and all associated images after confirmation.",
    );

    Logger.statement("list");
    Logger.dim("Lists all existing art with their slugs and titles.");

    Logger.statement("show <art-slug>");
    Logger.dim("Displays all metadata for a piece of art in the console.");

    Logger.statement("regenthumb [art-slug]");
    Logger.dim(
        "Regenerates thumbnails for all images, or just for a specific piece of art if a slug is provided.",
    );

    Logger.statement("regenpalette [character-slug]");
    Logger.dim(
        "Regenerates palette images for all characters, or just for a specific character if a slug is provided.",
    );

    Logger.nl();
    section("FLAGS");

    Logger.dim(
        `${Logger.inlineBold("--dry-run")}  Run without writing any files or making any changes.`,
    );
    Logger.dim(
        `${Logger.inlineBold("--variant")}  When appending or removing, target image variants instead of main images.`,
    );
    Logger.dim(
        `${Logger.inlineBold("--push")}     Pushes the changes to the remote repository.`,
    );
    Logger.dim(
        `${Logger.inlineBold("--help")}     Displays this help message.`,
    );
}

export interface AskOptions {
    prompt?: string;
    default?: string;
    required?: boolean;
    validate?: (value: string) => string | true;
}

export async function ask(options: AskOptions = {}): Promise<string> {
    const {
        prompt = "▌ ",
        default: defaultValue,
        required = false,
        validate,
    } = options;
    const getAnswer = async (): Promise<string> => {
        try {
            return await rl.question(`\x1b[2m${prompt}`);
        } catch (error) {
            Logger.nl();
            Logger.error(String(error));
            process.exit(1);
        }
    };

    let answer = await getAnswer();

    while (true) {
        if (required && !answer) {
            process.stdout.write("\x1b[0m");
            Logger.error("This field is required!");
            answer = await getAnswer();
            continue;
        }

        if (!answer && defaultValue !== undefined) {
            process.stdout.write(
                `\x1b[1A\r\x1b[2m${prompt}${defaultValue}\x1b[0m\n`,
            );
            return defaultValue;
        }

        if (validate && answer) {
            const result = validate(answer);
            if (result !== true) {
                process.stdout.write("\x1b[0m");
                Logger.error(result);
                answer = await getAnswer();
                continue;
            }
        }

        break;
    }

    process.stdout.write("\x1b[0m");
    return answer;
}

export function exit(code: number = 0): never {
    rl.close();
    process.exit(code);
}
