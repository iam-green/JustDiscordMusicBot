import { music, selectButtonID, select_data } from "../../modules/music";
import { Command, ExtendedInteraction } from "../../types/command";
import { Default, Error } from '../../modules/embed';
import { Search, URL } from "../../modules/youtube";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import youtube from 'ytdl-core';
import { Button } from "../../modules/component";
import { IMusicButtonSelectData } from "../../types/music";

export function ytdl(connection: VoiceConnection, interaction: ExtendedInteraction) {
    let server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
    const resource = createAudioResource(youtube(server.queue[0].url,{quality:'highestaudio',highWaterMark:1<<25}),{inlineVolume:true});
    resource.volume.setVolume(0.2);
    server.player = createAudioPlayer();
    connection.subscribe(server.player);
    server.player.play(resource);
    server.voice_id = interaction.member.voice.channel.id;
    server.player.on(AudioPlayerStatus.Idle,()=>{
        if(server.option.repeat) server.queue.push(server.queue[0]);
        server.queue.shift();
        if(server.queue.length>0) ytdl(connection, interaction);
        else {
            server = {
                queue: [],
                guild_id: server.guild_id,
                option: {
                    repeat: false,
                    pause: false
                }
            };
            connection.destroy();
        }
    });
}

export function selectButton(id: string, option: IMusicButtonSelectData, interaction: ExtendedInteraction) {
    let server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
    let select = select_data[select_data.findIndex(e=>e.id==id)];
    if(option == 'CANCEL') {
        select.message.deleteReply();
        select_data.splice(select_data.findIndex(e=>e.id===id),1);
    } else if(option == 'SELECT') {
        let voiceChannel = interaction.member.voice.channel;
        server.queue.push(select.queue[select.index]);
        const voiceConnection = joinVoiceChannel({
            channelId:voiceChannel.id,
            guildId:interaction.guildId,
            adapterCreator:interaction.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
        });
        if(server.queue.length<=1) ytdl(voiceConnection, interaction);
        select.message.editReply({
            embeds: [
                Default({
                    title: `선택한 곡이 재생목록에 추가됨`,
                    color: process.env.BOT_COLOR,
                    desc: [
                        `➯ 제목 : ${select.queue[select.index].title}`,
                        `➯ 게시자 : ${select.queue[select.index].owner}`,
                        `➯ 길이 : \`${select.queue[select.index].length}\``
                    ].join('\n'),
                    thumbnail: select.queue[select.index].image,
                    timestamp: true,
                    footer: {
                        text: interaction.user.tag,
                        iconURL: interaction.user.avatarURL()
                    }
                })
            ],
            components:[
                Button([
                    {
                        title: 'URL',
                        style: 'LINK',
                        url: select.queue[select.index].url
                    }
                ])
            ]
        });
        select_data.splice(select_data.findIndex(e=>e.id===id),1);
    } else {
        select.index += option == 'PREVIOUS' ? -1 : 1;
        select.message.editReply({
            embeds: [
                Default({
                    title: `\`${select.title}\` 검색목록 ( ${select.index+1} / ${select. queue.length} )`,
                    color: process.env.BOT_COLOR,
                    desc: [
                        `➯ 제목 : ${select.queue[select.index].title}`,
                        `➯ 게시자 : ${select.queue[select.index].owner}`,
                        `➯ 길이 : \`${select.queue[select.index].length}\``
                    ].join('\n'),
                    thumbnail: select.queue[select.index].image,
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
                        id: `SELECT_PREVIOUS_${interaction.user.id}_${select.id}`,
                        title: 'Previous',
                        style: 'SECONDARY',
                        disabled: select.index==0
                    },
                    {
                        id: `SELECT_NEXT_${interaction.user.id}_${select.id}`,
                        title: 'Next',
                        style: 'SECONDARY',
                        disabled: select.index==select.queue.length-1
                    },
                    {
                        id: `SELECT_SELECT_${interaction.user.id}_${select.id}`,
                        title: 'Select',
                        style: 'SUCCESS'
                    },
                    {
                        id: `SELECT_CANCEL_${interaction.user.id}_${select.id}`,
                        title: 'Cancel',
                        style: 'DANGER'
                    },
                    {
                        title: 'URL',
                        style: 'LINK',
                        url: select.queue[select.index].url
                    }
                ])
            ]
        });
    }
}

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
        const str = interaction.options.getString('keyword');
        const server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
        const voiceChannel = interaction.member.voice.channel;
        if(!voiceChannel) return interaction.reply(Error('보이스챗 정보를 가지고 오지 못하였습니다.'));
        const permission = voiceChannel.permissionsFor(interaction.client.user);
        if(!permission.has('CONNECT')) return interaction.reply(Error('보이스챗에 들어갈 수 있는 권한이 없습니다.'));
        if(!permission.has('SPEAK')) return interaction.reply(Error('보이스챗에서 말할 수 있는 권한이 없습니다.'));
        if(server.id && server.id != voiceChannel.id) return interaction.reply(Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.'));
        try {
            if(str.startsWith('https://')) { /* URL */
                const data = await URL(str);
                data.forEach(e=>server.queue.push(e));
                const voiceConnection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
                });
                if(server.queue.length<=data.length) ytdl(voiceConnection,interaction);
                return interaction.reply({
                    embeds: [
                        Default({
                            title: `${data.length}개의 곡${data.length>1?'들':''}이 재생목록에 추가되었습니다.`,
                            desc: [
                                `➯ 제목 : ${data[0].title}`,
                                `➯ 게시자 : ${data[0].owner}`,
                                `➯ 길이 : \`${data[0].length}\``
                            ].join('\n'),
                            color: process.env.BOT_COLOR,
                            thumbnail: data[0].image,
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
                                url:data[0].url
                            }
                        ])
                    ]
                });
            } else { /* Keyword */
                const data = await Search(str);
                let id = selectButtonID();
                let select = select_data[select_data.findIndex(e=>e.id==id)];
                select.queue = data;
                select.title = str;
                await interaction.reply({
                    embeds: [
                        Default({
                            title: `\`${select.title}\` 검색목록 ( ${select.index+1} / ${select. queue.length})`,
                            color: process.env.BOT_COLOR,
                            desc: [
                                `➯ 제목 : ${select.queue[select.index].title}`,
                                `➯ 게시자 : ${select.queue[select.index].owner}`,
                                `➯ 길이 : \`${select.queue[select.index].length}\``
                            ].join('\n'),
                            thumbnail: select.queue[select.index].image,
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
                                id: `SELECT_PREVIOUS_${interaction.user.id}_${select.id}`,
                                title: 'Previous',
                                style: 'SECONDARY',
                                disabled: select.index==0
                            },
                            {
                                id: `SELECT_NEXT_${interaction.user.id}_${select.id}`,
                                title: 'Next',
                                style: 'SECONDARY',
                                disabled: select.index==select.queue.length-1
                            },
                            {
                                id: `SELECT_SELECT_${interaction.user.id}_${select.id}`,
                                title: 'Select',
                                style: 'SUCCESS'
                            },
                            {
                                id: `SELECT_CANCEL_${interaction.user.id}_${select.id}`,
                                title: 'Cancel',
                                style: 'DANGER'
                            },
                            {
                                title: 'URL',
                                style: 'LINK',
                                url: select.queue[select.index].url
                            }
                        ])
                    ]
                });
                select.message = interaction;
                setTimeout(()=>{
                    select.message.deleteReply();
                    select_data.splice(select_data.findIndex(e=>e.id===id),1);
                },3*60*1000);
            }
        } catch(e) {
            console.error(e);
            return interaction.reply(Error(e.message));
        }
    }
});