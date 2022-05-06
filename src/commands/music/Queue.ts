import { Interaction } from "discord.js";
import { Button } from "../../modules/component";
import { Default } from "../../modules/embed";
import { music, queueButtonID, queue_data } from "../../modules/music";
import { Youtube } from "../../modules/youtube";
import { Command, ExtendedInteraction } from "../../types/command";
import { IMusicButtonQueueData } from "../../types/music";

export function getQueue(data: Array<Youtube>,num: number): Array<String> {
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

export function queueButton(id: string, option: IMusicButtonQueueData, interaction: ExtendedInteraction) {
    let server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
    let queue = queue_data[queue_data.findIndex(e=>e.id==id)];
    if(option == 'DELETE') {
        queue.message.deleteReply();
        queue_data.splice(queue_data.findIndex(e=>e.id==id),1);
    } else {
        queue.index += option == 'PREVIOUS' ? -1 : 1;
        queue.message.editReply({
            embeds: [
                Default({
                    title: `재생목록 ( ${queue.index+1} / ${queue.queue.length} )`,
                    color: process.env.BOT_COLOR,
                    desc: queue.queue[queue.index].replace(/\`1\`/g,server.option.pause?'⏸':server.option.repeat?'🔄':'▶️'),
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
                        id: `QUEUE_PREVIOUS_${interaction.user.id}_${queue.id}`,
                        title: 'Previous',
                        style: 'SECONDARY',
                        disabled: queue.index==0
                    },
                    {
                        id: `QUEUE_NEXT_${interaction.user.id}_${queue.id}`,
                        title: 'Next',
                        style: 'SECONDARY',
                        disabled: queue.index==queue.queue.length-1
                    },
                    {
                        id: `QUEUE_DELETE_${interaction.user.id}_${queue.id}`,
                        title: 'Delete Message',
                        style: 'DANGER'
                    }
                ])
            ]
        })
    }
}

export default new Command({
    name:"queue",
    description:"재생목록에 있는 곡 목록을 보여줍니다.",
    run: async ({ interaction }) => {
        let server = music[music.findIndex(e=>e.guild_id==interaction.guildId)];
        let voiceChannel = interaction.member.voice.channel;
        if(!voiceChannel) return Error('보이스챗 정보를 가지고 오지 못하였습니다.');
        let permission = voiceChannel.permissionsFor(interaction.client.user);
        if(!permission.has('CONNECT')) return Error('보이스챗에 들어갈 수 있는 권한이 없습니다.')
        if(!permission.has('SPEAK')) return Error('보이스챗에서 말할 수 있는 권한이 없습니다.');
        if(server.queue.length<1) return Error('재생목록에 곡이 없어서 반복 설정을 할 수 없습니다.');
        let id = queueButtonID();
        let queue = queue_data[queue_data.findIndex(e=>e.id==id)];
        queue.queue = getQueue(server.queue,10);
        const result = {
            embeds: [
                Default({
                    title: `재생목록 ( ${queue.index+1} / ${queue.queue.length} )`,
                    color: process.env.BOT_COLOR,
                    desc: queue.queue[queue.index].replace(/\`1\`/g,server.option.pause?'⏸':server.option.repeat?'🔄':'▶️'),
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
                        id: `QUEUE_PREVIOUS_${interaction.user.id}_${queue.id}`,
                        title: 'Previous',
                        style: 'SECONDARY',
                        disabled: queue.index==0
                    },
                    {
                        id: `QUEUE_NEXT_${interaction.user.id}_${queue.id}`,
                        title: 'Next',
                        style: 'SECONDARY',
                        disabled: queue.index==queue.queue.length-1
                    },
                    {
                        id: `QUEUE_DELETE_${interaction.user.id}_${queue.id}`,
                        title: 'Delete Message',
                        style: 'DANGER'
                    }
                ])
            ]
        }
        await interaction.reply(result);
        queue.message = interaction;
        setTimeout(()=>{
            queue.message.editReply({
                embeds: result.embeds,
                components: []
            });
            queue_data.splice(queue_data.findIndex(e=>e.id===id),1);
        },5*60*1000);
    }
});