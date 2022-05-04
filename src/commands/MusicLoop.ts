import { Music } from "../modules/music";
import { Command } from "../types/command";

export default new Command({
    name:"loop",
    description:"곡을 반복하여 재생하거나 반복 기능을 중지합니다.",
    run: async ({ interaction }) => {
        const music = new Music(interaction);
        interaction.reply(music.loop());
    }
});