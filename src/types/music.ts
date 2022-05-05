import { AudioPlayer } from "@discordjs/voice";
import { Youtube } from "../modules/youtube";

export type IMusicButtonQueueData = 'PREVIOUS' | 'NEXT' | 'DELETE';
export type IMusicButtonSelectData = 'PREVIOUS' | 'NEXT' | 'SELECT' | 'DELETE';

export interface IMusicGuild {
    id?: string;
    guild_id: string;
    queue: Array<Youtube>;
    player?: AudioPlayer;
    option: {
        repeat: boolean;
        pause: boolean;
    };
}