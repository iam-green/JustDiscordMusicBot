import { music } from "../modules/music";
import { Event } from "../types/event";

export default new Event("voiceStateUpdate", async (oldState,newState) => {
    const server = music[music.findIndex(e=>e.guild_id==oldState.guild.id)];
    if(!server) return;
    if(oldState.channelId == server.voice_id) {
        if(!newState.channelId) {/* Unexpectly bot left voice channel */
            server.queue = [];
            server.player.stop();
        } else if(oldState.channelId != newState.channelId) { /* Moved bot */
            server.voice_id = newState.channelId;
        }
    }
});