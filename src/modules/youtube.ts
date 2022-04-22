import axios from 'axios';

interface Youtube {
    title: string;
    owner: string;
    length: string;
    url: string;
    image: string;
}

const toTime = (sec: number): string => {
    let h: number = sec/3600|0;
    let m: number = sec/60%60|0;
    let s: number = sec%60;
    let h_str: string = h>0?h+':':'';
    let m_str: string = m<10&&h!=0?'0'+m:m.toString();
    let s_str: string = s<10?'0'+s:s.toString();
    return `${h_str}${m_str} : ${s_str}`;
}

const toSec = (time: string): number => {
    let res = 0;
    let txt = time.split(':').reverse();
    for(let i=0;i<txt.length;i++) res+=+txt[i]*(i==0?1:i==1?60:60*60);
    return res;
}

export async function Search(keyword: string,num: number = 5): Promise<Array<Youtube>> {
    try {
        const res = [];
        let parse = await axios(`https://www.youtube.com/results?search_query=${encodeURI(keyword)}&sp=CAASAhAB`);
        let data: string = parse.data.split('var ytInitialData = ')[1].split(';')[0];
        let list: Array<any> = JSON.parse(data).contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
        for(let i=0;i<(list.length<5?list.length:num);i++) res.push({
            title:list[i].videoRenderer.title.runs[0].text,
            owner:list[i].videoRenderer.shortBylineText.runs[0].text,
            length:!list[i].videoRenderer.lengthText?"LIVE":list[i].videoRenderer.lengthText.simpleText,
            url:'https://youtu.be/'+list[i].videoRenderer.videoId,
            image:list[i].videoRenderer.thumbnail.thumbnails[0].url
        });
        return res;
    } catch(e) {
        return [];
    }
}

export async function URL(url: string): Promise<Array<Youtube>> {
    try {
        let res: Array<Youtube> = [];
        if(url.includes('list')) { // Playlist URL
            let id: string = url.indexOf('playlist?')!=-1?url.split('?list=')[1]:url.split('&list=')[1].split('&index')[0];
            let parse = await axios(`https://www.youtube.com/playlist?list=${id}`);
            let data: string = parse.data.split('var ytInitialData = ')[1].split(';')[0];
            let list: Array<any> = JSON.parse(data).contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
            for(let i=0;i<list.length;i++) res.push({
                title:list[i].playlistVideoRenderer.title.runs[0].text,
                owner:list[i].playlistVideoRenderer.shortBylineText.runs[0].text,
                length:list[i].playlistVideoRenderer.lengthText.simpleText,
                url:'https://youtu.be/'+list[i].playlistVideoRenderer.videoId,
                image:list[i].playlistVideoRenderer.thumbnail.thumbnails[0].url
            });
        } else { // Video URL
            let id: string = url.indexOf('youtu.be')!=-1?url.split('/')[3]:url.split('?v=')[1];
            let parse = await axios(`https://www.youtube.com/watch?v=${id}`);
            let data: string = parse.data.split('var ytInitialPlayerResponse = ')[1].split('};')[0]+'}';
            let list = JSON.parse(data).videoDetails;
            res.push({
                title:list.title,
                owner:list.author,
                length:toTime(list.lengthSeconds),
                url:'https://youtu.be/'+list.videoId,
                image:list.thumbnail.thumbnails[0].url
            });
        }
        return res;
    } catch(e) {
        return [];
    }
}