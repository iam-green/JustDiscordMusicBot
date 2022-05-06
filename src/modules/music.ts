import { IMusicButtonQueue, IMusicButtonSelect, IMusicGuild } from "../types/music";

const random_text = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const music: Array<IMusicGuild> = [];
export const queue_data: Array<IMusicButtonQueue> = [];
export const select_data: Array<IMusicButtonSelect> = [];

export function queueButtonID(length: number = 16) {
    let res = '';
    for(let i=0;i<length;i++) res+=random_text[Math.random()*random_text.length|0];
    if(queue_data.find(e=>e.id==res)) return queueButtonID(length);
    else {
        queue_data.push({
            id: res,
            queue: [],
            index: 0
        });
        return res;
    }
}

export function selectButtonID(length: number = 16) {
    let res = '';
    for(let i=0;i<length;i++) res+=random_text[Math.random()*random_text.length|0];
    if(select_data.find(e=>e.id==res)) return selectButtonID(length);
    else {
        select_data.push({
            id: res,
            title: '',
            queue: [],
            index: 0
        });
        return res;
    }
}