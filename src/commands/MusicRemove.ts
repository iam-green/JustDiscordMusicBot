import { Command } from "../types/command";

export default new Command({
    name:"remove",
    description:"재생목록에 있는 특정한 곡을 지웁니다.",
    options:[
        {
            type:4,
            name:"index",
            description:"지울 곡의 위치를 입력해주세요.",
            required:true
        },
        {
            type:4,
            name:"count",
            description:"지울 곡의 갯수를 입력해주세요.",
            required:false
        }
    ],
    run: async ({ interaction }) => {
        
    }
});