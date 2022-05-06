import { AudioPlayer } from "@discordjs/voice";
import { Message } from "discord.js";
import { Youtube } from "../modules/youtube";
import { ExtendedInteraction } from "./command";

export interface IMusicGuild {
    id?: string;
    guild_id: string;
    voice_id?: string;
    queue: Array<Youtube>;
    player?: AudioPlayer;
    option: {
        repeat: boolean;
        pause: boolean;
    };
}

export interface IMusicButton {
    id: string;
    message?: ExtendedInteraction;
    index: number;
}

export interface IMusicButtonQueue extends IMusicButton {
    queue: Array<String>;
}

export interface IMusicButtonSelect extends IMusicButton {
    title?: string;
    queue: Array<Youtube>;
}

export type IMusicButtonQueueData = 'PREVIOUS' | 'NEXT' | 'DELETE';
export type IMusicButtonSelectData = 'PREVIOUS' | 'NEXT' | 'SELECT' | 'CANCEL';