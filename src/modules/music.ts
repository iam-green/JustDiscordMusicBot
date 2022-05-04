import { Message } from "discord.js";
import { IMusicGuild } from "../types/music";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, VoiceConnection, AudioPlayerStatus } from '@discordjs/voice';
import ytdl from 'ytdl-core';
import { Default, Error } from "./embed";
import { ExtendedInteraction } from "../types/command";
import { Search, URL } from "./youtube";
import { Button } from "./component";

const music: Array<IMusicGuild> = [];

export class Music {
    private readonly message: ExtendedInteraction;

    constructor(message: ExtendedInteraction) {
        if(!music.find(e=>e.id==message.guildId)) music.push({
            id: undefined,
            guild_id: message.guildId,
            queue: [],
            option: {
                repeat: false,
                pause: false
            }
        });
        this.message = message;
    }

    ytdl(connection: VoiceConnection) {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        const resource = createAudioResource(ytdl(server.queue[0].url,{quality:'highestaudio',highWaterMark:1<<25}),{inlineVolume:true});
        resource.volume.setVolume(0.2);
        server.player = createAudioPlayer();
        connection.subscribe(server.player);
        server.player.play(resource);
        server.player.on(AudioPlayerStatus.Idle,()=>{
            if(server.option.repeat) server.queue.push(server.queue[0]);
            server.queue.shift();
            if(server.queue.length>0) this.ytdl(connection);
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
        })
    }
    
    async play(str: string/* URL or Keyword */) {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        try {
            if(str.startsWith('https://')) { /* URL */
                const data = await URL(str);
                data.forEach(e=>server.queue.push(e));
                const voiceConnection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: this.message.guildId,
                    adapterCreator: this.message.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
                });
                if(server.queue.length<=data.length) this.ytdl(voiceConnection);
                return {
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
                                text: this.message.user.tag,
                                iconURL: this.message.user.avatarURL()
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
                }
            } else { /* Keyword */
                const data = await Search(str);
                return Error('개발중...');
            }
        } catch(e) {
            return Error(e.message);
        }
    }

    skip(num: number) {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        if(server.queue.length<num) return Error('입력한 값이 재생목록에 있는 곡의 수보다 너무 커서 스킵을 할 수 없습니다.');
        for(let i=0;i<num-1;i++) {
            if(server.option.repeat) server.queue.push(server.queue[0]);
            server.queue.shift();
        }
        server.player.stop();
        return {
            embeds:[
                Default({
                    title: '곡 스킵됨',
                    desc: `재생목록에 있는 ${num}개의 곡이 스킵되었습니다.`,
                    color: process.env.BOT_COLOR,
                    timestamp: true,
                    footer: {
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
                    }
                })
            ]
        };
    }

    nowPlay() {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 현재 재생중인 곡을 볼 수 없습니다.');
        return {
            embeds:[
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
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
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
        };
    }

    pause() {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 일시정지를 할 수 없습니다.');
        if(server.option.pause) return Error('이미 곡이 일시중지되어 있습니다.');
        server.option.pause = true;
        server.player.pause();
        return {
            embeds: [
                Default({
                    title:'곡 일시중지됨',
                    desc:'현재 재생하고 있는 곡이 일시중지되었습니다.',
                    color: process.env.BOT_COLOR,
                    timestamp: true,
                    footer: {
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
                    }
                })
            ]
        };
    }

    resume() {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 다시 재생을 할 수 없습니다.');
        if(!server.option.pause) return Error('이미 곡이 재생중입니다.');
        server.option.pause = false;
        server.player.unpause();
        return {
            embeds: [
                Default({
                    title: '곡 재생됨',
                    desc: '일시중지된 곡을 다시 재생합니다.',
                    color: process.env.BOT_COLOR,
                    timestamp: true,
                    footer: {
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
                    }
                })
            ]
        };
    }

    stop() {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 정지할 수 없습니다.');
        server.queue = [];
        server.player.stop();
        return {
            embeds:[
                Default({
                    title: '재생 중지됨',
                    desc: '곡 재생이 중지되었습니다.',
                    color: process.env.BOT_COLOR,
                    timestamp: true,
                    footer: {
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
                    }
                })
            ]
        };
    }

    loop() {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.id && server.id != voiceChannel.id) return Error('봇이 다른 보이스챗에 있어서 이 명령을 실행할 수 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 반복 설정을 할 수 없습니다.');
        server.option.repeat = !server.option.repeat;
        return {embeds:[
            Default({
                title: `반복 ${server.option.repeat?'실행':'중지'}됨`,
                desc: `반복 기능을 ${server.option.repeat?'실행':'중지'}하였습니다.`,
                color: process.env.BOT_COLOR,
                timestamp: true,
                footer: {
                    text: this.message.user.tag,
                    iconURL: this.message.user.avatarURL()
                }
            })
        ]};
    }
}