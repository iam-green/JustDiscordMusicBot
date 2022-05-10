import { SlashCommandBuilder } from "@discordjs/builders";
import { Default, Error } from "../../modules/embed";
import { music } from "../../modules/music";
import { Command, CommandType } from "../../types/command";

export default new Command({
    ...new SlashCommandBuilder()
        .setName('loop')
        .setDescription('곡을 반복하여 재생하거나 반복 기능을 중지합니다.') as unknown as CommandType,
    run: async ({ interaction }) => {
        const server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
        const voiceChannel = interaction.member.voice.channel;
        if(!voiceChannel) return interaction.reply(Error('보이스챗 정보를 가지고 오지 못하였습니다.'));
        const permission = voiceChannel.permissionsFor(interaction.client.user);
        if(!permission.has('CONNECT')) return interaction.reply(Error('보이스챗에 들어갈 수 있는 권한이 없습니다.'))
        if(!permission.has('SPEAK')) return interaction.reply(Error('보이스챗에서 말할 수 있는 권한이 없습니다.'));
        if(server.id && server.id != voiceChannel.id) return interaction.reply(Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.'));
        if(server.queue.length<1) return interaction.reply(Error('재생목록에 곡이 없어서 반복 설정을 할 수 없습니다.'));
        server.option.repeat = !server.option.repeat;
        return interaction.reply({
            embeds:[
                Default({
                    title: `반복 ${server.option.repeat?'실행':'중지'}됨`,
                    desc: `반복 기능을 ${server.option.repeat?'실행':'중지'}하였습니다.`,
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