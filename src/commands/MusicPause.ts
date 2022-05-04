import { Music } from "../modules/music";
import { Command } from "../types/command";

export default new Command({
    name:"pause",
    description:"현재 재생하고 있는 곡을 일시중지합니다.",
    run: async ({ interaction }) => {
        const music = new Music(interaction);
        interaction.reply(music.pause());
    }
});