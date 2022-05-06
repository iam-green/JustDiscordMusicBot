import { Command } from "../../types/command";
import { music } from "../../modules/music";
import { Default, Error } from '../../modules/embed';
import { Button } from "../../modules/component";

export default new Command({
    name:"nowplay",
    description:"현재 재생중인 곡 정보를 보여줍니다.",
    run: async ({ interaction }) => {
        const server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
        const voiceChannel = interaction.member.voice.channel;
        if(!voiceChannel) return interaction.reply(Error('보이스챗 정보를 가지고 오지 못하였습니다.'));
        const permission = voiceChannel.permissionsFor(interaction.client.user);
        if(!permission.has('CONNECT')) return interaction.reply(Error('보이스챗에 들어갈 수 있는 권한이 없습니다.'));
        if(!permission.has('SPEAK')) return interaction.reply(Error('보이스챗에서 말할 수 있는 권한이 없습니다.'));
        if(server.id && server.id != voiceChannel.id) return interaction.reply(Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.'));
        if(server.queue.length<1) return interaction.reply(Error('재생목록에 곡이 없어서 현재 재생중인 곡을 볼 수 없습니다.'));
        return interaction.reply({
            embeds: [
                Default({
                    title: `현재 재생중인 곡`,
                    color: process.env.BOT_COLOR,
                    thumbnail: server.queue[0].image,
                    desc: [
                        `➯ 제목 : ${server.queue[0].title}`,
                        `➯ 게시자 : ${server.queue[0].owner}`,
                        `➯ 길이 : \`${server.queue[0].length}\``,
                        `➯ 상태 : ${server.option.pause?'⏸':server.option.repeat?'🔄':'▶️'}`
                    ].join('\n'),
                    timestamp: true,
                    footer: {
                        text: interaction.user.tag,
                        iconURL: interaction.user.avatarURL()
                    }
                })
            ],
            components: [
                Button([
                    {
                        title:'URL',
                        style:'LINK',
                        url:server.queue[0].url
                    }
                ])
            ],
            ephemeral: true
        });
    }
});