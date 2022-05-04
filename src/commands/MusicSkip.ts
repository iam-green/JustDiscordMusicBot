import { Music } from "../modules/music";
import { Command } from "../types/command";

export default new Command({
    name:"skip",
    description:"곡을 스킵합니다.",
    options:[
        {
            type:4,
            name:"count",
            description:"스킵할 곡의 갯수를 입력해주세요.",
            required:false
        }
    ],
    run: async ({ interaction }) => {
        const music = new Music(interaction);
        interaction.reply(music.skip(interaction.options.getInteger('count')||1));
    }
});