import { Message } from "discord.js";
import { Youtube } from "../modules/youtube";

export interface IButtonData {
    id: string;
    message?: Message<boolean>;
    index: number;
}

export interface IButtonQueueData extends IButtonData {
    queue: Array<String>;
}

export interface IButtonSelectData extends IButtonData {
    title?: string;
    queue: Array<Youtube>;
}