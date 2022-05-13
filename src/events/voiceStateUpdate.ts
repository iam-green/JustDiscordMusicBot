import { music } from "../modules/music";
import { Event } from "../types/event";
import { client } from "../loaders/discord";

export default new Event("voiceStateUpdate", async (oldState,newState) => {
    
    /* Music */
    const server = music[music.findIndex(e=>e.voice_id==oldState.channelId)];
    if(!server) return; /* Detect Voice Channel Exist */
    if(oldState.id == client.user.id) { /* Bot Voice State Updated */
        if(!newState.channelId) { /* Unexpectly Bot Left Voice Channel */
            server.queue = [];
            server.player.stop();
        } else if(oldState.channelId && oldState.channelId != newState.channelId) { /* Moved Bot By Other */
            server.voice_id = newState.channelId;
        }
    }
    
});