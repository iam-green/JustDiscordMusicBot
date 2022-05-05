import { Message } from "discord.js";
import { IMusicButtonQueueData, IMusicButtonSelectData, IMusicGuild } from "../types/music";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, VoiceConnection, AudioPlayerStatus } from '@discordjs/voice';
import ytdl from 'ytdl-core';
import { Default, Error } from "./embed";
import { ExtendedInteraction } from "../types/command";
import { Search, URL, Youtube } from "./youtube";
import { Button } from "./component";
import { button_queue_data, button_select_data, generateQueueButtonID, generateSelectButtonID } from "./button";

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
                let id = generateSelectButtonID();
                let select = button_select_data[button_select_data.findIndex(e=>e.id==id)];
                select.queue = data;
                select.title = str;
                select.message = await this.message.channel.send({
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
                                text: this.message.user.tag,
                                iconURL: this.message.user.avatarURL()
                            }
                        })
                    ],
                    components: [
                        Button([
                            {
                                id: `SELECT_PREVIOUS_${this.message.user.id}_${select.id}`,
                                title: 'Previous',
                                style: 'SECONDARY',
                                disabled: select.index==0
                            },
                            {
                                id: `SELECT_NEXT_${this.message.user.id}_${select.id}`,
                                title: 'Next',
                                style: 'SECONDARY',
                                disabled: select.index==select.queue.length-1
                            },
                            {
                                id: `SELECT_SELECT_${this.message.user.id}_${select.id}`,
                                title: 'Select',
                                style: 'SUCCESS'
                            },
                            {
                                id: `SELECT_CANCEL_${this.message.user.id}_${select.id}`,
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
                })
            };
            return {
                embeds:[
                    Default({
                        title: '성공적으로 곡 선택 메세지가 채널에 전송됨',
                        desc: '성공적으로 곡 선택 메세지가 채널에 전송되었습니다.',
                        color: process.env.BOT_COLOR,
                        timestamp: true
                    })
                ],
                ephemeral: true,
                footer: {
                    text: this.message.user.tag,
                    iconURL: this.message.user.avatarURL()
                }
            };
        } catch(e) {
            console.error(e);
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

    getQueue(data: Array<Youtube>,num: number): Array<String> {
        let temp = (data.length/num|0)==(data.length/num)?0:1;
        let result = [];
        num=num?num:5;
        for(let i=0;i<(data.length/num|0)+temp;i++) {
            let list = [];
            if((data.length-i*num)>num) {
                for(let j=0;j<num;j++) list.push(`\`${i*num+j+1}\` ${data[i*num+j].title} \`${data[i*num+j].length}\``);
                result.push(list.join('\n'));
            } else {
                for(let j=0;j<data.length-i*num;j++) list.push(`\`${i*num+j+1}\` ${data[i*num+j].title} \`${data[i*num+j].length}\``);
                result.push(list.join('\n'));
            }
        }
        return result;
    }

    async queue() {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let voiceChannel = this.message.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(this.message.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 반복 설정을 할 수 없습니다.');
        let id = generateQueueButtonID();
        let queue = button_queue_data[button_queue_data.findIndex(e=>e.id==id)];
        queue.queue = this.getQueue(server.queue,10);
        queue.message = await this.message.channel.send({
            embeds: [
                Default({
                    title: `재생목록 ( ${queue.index+1} / ${queue.queue.length} )`,
                    color: process.env.BOT_COLOR,
                    desc: queue.queue[queue.index].replace(/\`1\`/g,server.option.pause?'⏸':server.option.repeat?'🔄':'▶️'),
                    timestamp: true,
                    footer: {
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
                    }
                })
            ],
            components:[
                Button([
                    {
                        id: `QUEUE_PREVIOUS_${this.message.user.id}_${queue.id}`,
                        title: 'Previous',
                        style: 'SECONDARY',
                        disabled: queue.index==0
                    },
                    {
                        id: `QUEUE_NEXT_${this.message.user.id}_${queue.id}`,
                        title: 'Next',
                        style: 'SECONDARY',
                        disabled: queue.index==queue.queue.length-1
                    },
                    {
                        id: `QUEUE_DELETE_${this.message.user.id}_${queue.id}`,
                        title: 'Delete Message',
                        style: 'DANGER'
                    }
                ])
            ]
        });
        return {
            embeds: [
                Default({
                    title: '재생목록 성공적으로 전송됨',
                    desc: '재생목록이 성공적으로 현재 채널에 전송되었습니다.',
                    color: process.env.BOT_COLOR,
                    timestamp: true,
                    footer: {
                        text: this.message.user.tag,
                        iconURL: this.message.user.avatarURL()
                    }
                })
            ],
            ephemeral :true
        };
    }

    queueButton(id: string, option: IMusicButtonQueueData) {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let queue = button_queue_data[button_queue_data.findIndex(e=>e.id==id)];
        if(option == 'DELETE') {
            queue.message.delete();
            button_queue_data.splice(button_queue_data.findIndex(e=>e.id==id),1);
        } else {
            queue.index += option == 'PREVIOUS' ? -1 : 1;
            queue.message.edit({
                embeds: [
                    Default({
                        title: `재생목록 ( ${queue.index+1} / ${queue.queue.length} )`,
                        color: process.env.BOT_COLOR,
                        desc: queue.queue[queue.index].replace(/\`1\`/g,server.option.pause?'⏸':server.option.repeat?'🔄':'▶️'),
                        timestamp: true,
                        footer: {
                            text: this.message.user.tag,
                            iconURL: this.message.user.avatarURL()
                        }
                    })
                ],
                components:[
                    Button([
                        {
                            id: `QUEUE_PREVIOUS_${this.message.user.id}_${queue.id}`,
                            title: 'Previous',
                            style: 'SECONDARY',
                            disabled: queue.index==0
                        },
                        {
                            id: `QUEUE_NEXT_${this.message.user.id}_${queue.id}`,
                            title: 'Next',
                            style: 'SECONDARY',
                            disabled: queue.index==queue.queue.length-1
                        },
                        {
                            id: `QUEUE_DELETE_${this.message.user.id}_${queue.id}`,
                            title: 'Delete Message',
                            style: 'DANGER'
                        }
                    ])
                ]
            })
        }
    }

    selectButton(id: string, option: IMusicButtonSelectData) {
        let server = music[music.findIndex(e=>e.guild_id==this.message.guildId)];
        let select = button_select_data[button_select_data.findIndex(e=>e.id==id)];
        if(option == 'DELETE') {
            select.message.delete();
            button_select_data.splice(button_select_data.findIndex(e=>e.id===id),1);
        } else if(option == 'SELECT') {
            let voiceChannel = this.message.member.voice.channel;
            server.queue.push(select.queue[select.index]);
            const voiceConnection = joinVoiceChannel({
                channelId:voiceChannel.id,
                guildId:this.message.guildId,
                adapterCreator:this.message.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator
            });
            if(server.queue.length<=1) this.ytdl(voiceConnection);
            select.message.edit({
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
                            text: this.message.user.tag,
                            iconURL: this.message.user.avatarURL()
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
            button_select_data.splice(button_select_data.findIndex(e=>e.id===id),1);
        } else {
            select.index += option == 'PREVIOUS' ? -1 : 1;
            select.message.edit({
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
                            text: this.message.user.tag,
                            iconURL: this.message.user.avatarURL()
                        }
                    })
                ],
                components: [
                    Button([
                        {
                            id: `SELECT_PREVIOUS_${this.message.user.id}_${select.id}`,
                            title: 'Previous',
                            style: 'SECONDARY',
                            disabled: select.index==0
                        },
                        {
                            id: `SELECT_NEXT_${this.message.user.id}_${select.id}`,
                            title: 'Next',
                            style: 'SECONDARY',
                            disabled: select.index==select.queue.length-1
                        },
                        {
                            id: `SELECT_SELECT_${this.message.user.id}_${select.id}`,
                            title: 'Select',
                            style: 'SUCCESS'
                        },
                        {
                            id: `SELECT_CANCEL_${this.message.user.id}_${select.id}`,
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
}