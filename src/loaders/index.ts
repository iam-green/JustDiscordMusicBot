import environmentChecker from './environment';
import discordLoader from './discord';
export default async () => {
    await environmentChecker();
    await discordLoader();
}