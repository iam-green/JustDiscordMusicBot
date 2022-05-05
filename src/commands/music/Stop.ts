import { Music } from "../../modules/music";
import { Command } from "../../types/command";

export default new Command({
    name:"stop",
    description:"곡 재생을 중지합니다.",
    run: async ({ interaction }) => {
        const music = new Music(interaction);
        interaction.reply(music.stop());
    }
});