import { Music } from "../../modules/music";
import { Command } from "../../types/command";

export default new Command({
    name:"resume",
    description:"일시중지된 곡을 다시 재생합니다.",
    run: async ({ interaction }) => {
        const music = new Music(interaction);
        interaction.reply(music.resume());
    }
});