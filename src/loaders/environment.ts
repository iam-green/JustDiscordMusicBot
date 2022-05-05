const format = function (name: string) {
    return `Environment '${name}' is empty`;
};

export const ENVIRONMENT_NAMES = [
    'BOT_NAME',
    'BOT_TOKEN',
    'BOT_COLOR',
    'BOT_ACTIVITY'
];

export default async () => {
    for (const env_name of ENVIRONMENT_NAMES) {
        if (!process.env[env_name]) throw new Error(format(env_name));
    }
};
