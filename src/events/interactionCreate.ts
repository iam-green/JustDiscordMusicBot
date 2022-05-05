import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "../types/command";
import { client } from "../loaders/discord";
import { Event } from "../types/event";
import { Error } from "../modules/embed";
import { Music } from "../modules/music";
import { button_queue_data, button_select_data } from "../modules/button";
import { IMusicButtonQueueData, IMusicButtonSelectData } from "../types/music";

export default new Event("interactionCreate", async (interaction) => {
    const music = new Music(interaction as ExtendedInteraction);
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
            if(!button_queue_data.find(e=>e.id==id[3])) return;
            music.queueButton(id[3],id[1] as IMusicButtonQueueData);
            await interaction.deferUpdate();
        } else if(id[0]=='SELECT') {
            if(!button_select_data.find(e=>e.id==id[3])) return;
            music.selectButton(id[3],id[1] as IMusicButtonSelectData);
            await interaction.deferUpdate();
        }
    } else if(interaction.isContextMenu()) {
        // TODO
    }
});