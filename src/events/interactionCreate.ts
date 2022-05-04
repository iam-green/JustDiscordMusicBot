import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "../types/command";
import { client } from "../loaders/discord";
import { Event } from "../types/event";
import { Error } from "../modules/embed";

export default new Event("interactionCreate", async (interaction) => {
    if(interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.followUp(Error("명령어가 존재하지 않습니다."));
        command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client,
            interaction: interaction as ExtendedInteraction
        });
    } else if(interaction.isButton()) {
        // let id = interaction.customId.split('_');
        // TODO
    } else if(interaction.isContextMenu()) {
        // TODO
    }
});