import { ExtendedClient } from "../types/client";

export const client = new ExtendedClient();

export default async () => {
    await client.start();
}