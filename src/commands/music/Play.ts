import { Music } from "../../modules/music";
import { Command } from "../../types/command";

export default new Command({
    name:"play",
    description:"곡을 재생합니다.",
    options:[
        {
            type:3,
            name:"keyword",
            description:"링크나 검색어를 입력해주세요.",
            required:true
        }
    ],
    run: async ({ interaction }) => {
        const music = new Music(interaction);
        interaction.reply(await music.play(interaction.options.getString('keyword')));
    }
});