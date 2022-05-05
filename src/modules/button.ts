import { IButtonData, IButtonQueueData, IButtonSelectData } from "../types/button";

const text = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const button_queue_data: Array<IButtonQueueData> = [];
export const button_select_data: Array<IButtonSelectData> = [];

export function generateQueueButtonID(length: number = 16) {
    let res = '';
    for(let i=0;i<length;i++) res+=text[Math.random()*text.length|0];
    if(button_queue_data.find(e=>e.id==res)) return generateQueueButtonID(length);
    else {
        button_queue_data.push({
            id: res,
            queue: [],
            index: 0
        });
        return res;
    }
}

export function generateSelectButtonID(length: number = 16) {
    let res = '';
    for(let i=0;i<length;i++) res+=text[Math.random()*text.length|0];
    if(button_select_data.find(e=>e.id==res)) return generateSelectButtonID(length);
    else {
        button_select_data.push({
            id: res,
            title: '',
            queue: [],
            index: 0
        });
        return res;
    }
}