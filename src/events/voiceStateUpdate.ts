import { music } from "../modules/music";
import { Event } from "../types/event";
import { client } from "../loaders/discord";

export default new Event("voiceStateUpdate", async (oldState,newState) => {
    if(oldState.id == client.user.id) { /* Detect Bot Voice Status Update */
        const server = music[music.findIndex(e=>e.guild_id==oldState.guild.id)];
        if(!server) return;
        if(oldState.channelId == server.voice_id) {
            if(!newState.channelId) {/* Unexpectly Bot Left Voice Channel */
                server.queue = [];
                server.player.stop();
            } else if(oldState.channelId != newState.channelId) { /* Moved Bot By Other */
                server.voice_id = newState.channelId;
            }
        }
    }
});