import { EmojiIdentifierResolvable, MessageActionRow, MessageButton } from 'discord.js';

interface Button {
    id?: string;
    title: string;
    style: 'PRIMARY' | 'SECONDARY' | 'SUCCESS' | 'DANGER' | 'LINK';
    disabled?: boolean;
    emoji?: EmojiIdentifierResolvable;
    url?: string;
}


export function Button(option: Array<Button>): MessageActionRow {
    const row = new MessageActionRow();
    for(let i=0;i<option.length;i++) {
        let btn = new MessageButton()
            .setLabel(option[i].title)
            .setStyle(option[i].style);
        if(option[i].disabled) btn.setDisabled(option[i].disabled);
        if(option[i].emoji) btn.setEmoji(option[i].emoji);
        if(option[i].url) btn.setURL(option[i].url);
        else if(option[i].id) btn.setCustomId(option[i].id);
        else continue;
        row.addComponents(btn);
    }
    return row;
}