import { Command } from "../../types/command";
import { Default, Error } from '../../modules/embed';
import { music } from "../../modules/music";

export default new Command({
    name:"remove",
    description:"재생목록에 있는 특정한 곡을 지웁니다.",
    options:[
        {
            type:4,
            name:"index",
            description:"지울 곡의 위치를 입력해주세요.",
            required:true
        },
        {
            type:4,
            name:"count",
            description:"지울 곡의 갯수를 입력해주세요.",
            required:false
        }
    ],
    run: async ({ interaction }) => {
        const index = interaction.options.getInteger('index') | 1;
        const num = interaction.options.getInteger('count') | 1;
        const server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
        const voiceChannel = interaction.member.voice.channel;
        if(!voiceChannel) return interaction.reply(Error('보이스챗 정보를 가지고 오지 못하였습니다.'));
        if(server.id && server.id != voiceChannel.id) return interaction.reply(Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.'));
        const permission = voiceChannel.permissionsFor(interaction.client.user);
        if(!permission.has('CONNECT')) return interaction.reply(Error('보이스챗에 들어갈 수 있는 권한이 없습니다.'));
        if(!permission.has('SPEAK')) return interaction.reply(Error('보이스챗에서 말할 수 있는 권한이 없습니다.'));
        if(index<1 || num<1 || num+index-1>server.queue.length) return interaction.reply(Error('위치 또는 갯수의 범위가 초과되었습니다.'));
        if(server.queue.length<1) return interaction.reply(Error('재생목록에 곡이 없어서 재생목록에 있는 곡을 지울 수 없습니다.'));
        server.queue.splice(index-1,num);
        if(server.queue.length==num) server.player.stop();
        return interaction.reply({
            embeds:[
                Default({
                    title: '곡 삭제됨',
                    desc: '재생목록에 있는 특정 곡이 제거되었습니다.',
                    color: process.env.BOT_COLOR,
                    timestamp: true,
                    footer: {
                        text: interaction.user.tag,
                        iconURL: interaction.user.avatarURL()
                    }
                })
            ]
        });
    }
});