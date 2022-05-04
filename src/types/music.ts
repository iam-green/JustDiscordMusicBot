import { AudioPlayer } from "@discordjs/voice";
import { Youtube } from "../modules/youtube";

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