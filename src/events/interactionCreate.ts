import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "../types/command";
import { client } from "../loaders/discord";
import { Event } from "../types/event";
import { Error } from "../modules/embed";
import { music, queue_data, select_data } from "../modules/music";
import { IMusicButtonQueueData, IMusicButtonSelectData } from "../types/music";
import { selectButton } from "../commands/music/Play";
import { queueButton } from "../commands/music/Queue";

export default new Event("interactionCreate", async (interaction) => {
    if(!music.find(e=>e.id==interaction.guildId)) music.push({
        id: undefined,
        guild_id: interaction.guildId,
        queue: [],
        option: {
            repeat: false,
            pause: false
        }
    });
    if(interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return interaction.followUp(Error("명령어가 존재하지 않습니다."));
        command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client,
            interaction: interaction as ExtendedInteraction
        });
    } else if(interaction.isButton()) {
        let id = interaction.customId.split('_');
        /*
            id[0] : Main Command
            id[1] : Sub Command
            id[2] : User ID
            id[3] : Data
        */
        if(id[2]!=interaction.user.id) return;
        if(id[0]=='QUEUE') {
            if(!queue_data.find(e=>e.id==id[3])) return;
            queueButton(id[3],id[1] as IMusicButtonQueueData,interaction as unknown as ExtendedInteraction);
            await interaction.deferUpdate();
        } else if(id[0]=='SELECT') {
            if(!select_data.find(e=>e.id==id[3])) return;
            selectButton(id[3],id[1] as IMusicButtonSelectData,interaction as unknown as ExtendedInteraction);
            await interaction.deferUpdate();
        }
    } else if(interaction.isContextMenu()) {
        // TODO
    }
});