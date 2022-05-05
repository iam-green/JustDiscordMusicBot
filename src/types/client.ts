import {
    ApplicationCommandDataResolvable,
    Client,
    ClientEvents,
    Collection,
    Intents
} from "discord.js";
import { CommandType } from "./command";
import glob from "glob";
import { promisify } from "util";
import { Event } from "./event";

const globPromise = promisify(glob);

export interface RegisterCommandsOptions {
    guildId?: string;
    commands: ApplicationCommandDataResolvable[];
}

export class ExtendedClient extends Client {
    commands: Collection<string, CommandType> = new Collection();

    constructor() {
        super({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_VOICE_STATES
            ],
        });
    }

    async start() {
        await this.registerModules();
        await this.login(process.env.BOT_TOKEN);
    }

    async importFile(filePath: string) {
        return (await import(filePath))?.default;
    }

    async registerCommands({ commands, guildId }: RegisterCommandsOptions) {
        if(guildId) {
            await this.guilds.cache.get(guildId)?.commands.set(commands);
            console.log(`Registering Commands to \x1b[32m${guildId}\x1b[0m`);
        } else {
            await this.application?.commands.set(commands);
            console.log('Registering \x1b[32mGlobal Commands\x1b[0m');
        }
    }

    async registerModules() {
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = await globPromise(`${__dirname}/../commands/*{.ts,.js}`);
        const commandFilesInFolder = await globPromise(`${__dirname}/../commands/*/*{.ts,.js}`);
        for (const filePath of [...commandFiles,...commandFilesInFolder]) {
            const command: CommandType = await this.importFile(filePath);
            if (!command.name) return;
            this.commands.set(command.name, command);
            slashCommands.push(command);
            console.log(`Added \x1b[33m${command.name}\x1b[0m Command (Location : \x1b[32m/src/${filePath.split('../')[1]}\x1b[0m)`);
        }
        this.on('ready', () => {
            this.registerCommands({commands: slashCommands});
        });
        const eventFiles = await globPromise(`${__dirname}/../events/*{.ts,.js}`);
        for (const filePath of eventFiles) {
            const event: Event<keyof ClientEvents> = await this.importFile(filePath);
            this.on(event.event, event.run);
        }
    }
}