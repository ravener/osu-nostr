import { NewsPost } from './osu.js';
import log from './log.js';
import { hexToBytes } from '@noble/hashes/utils';
import { finalizeEvent } from 'nostr-tools';
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool';
import WebSocket from 'ws';
useWebSocketImplementation(WebSocket);

const RELAYS = process.env.RELAYS?.split(',');
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RELAYS) {
    console.error(
        'Please specify a comma seperated list of relays to use with the RELAYS variable.'
    );
    process.exit(1);
}

log.info(`Using relays:\n${RELAYS.map(r => `  * ${r}`).join('\n')}`);

if (!PRIVATE_KEY) {
    console.error('Please specify a nostr private key in PRIVATE_KEY variable.');
    process.exit(1);
}

const sk = hexToBytes(PRIVATE_KEY);
const pool = new SimplePool();

export async function postNews(news: NewsPost): Promise<void> {
    const url = `https://osu.ppy.sh/home/news/${news.slug}`;
    const content = `${news.preview}\n\n${url}\n\n#osugame`;

    const event = finalizeEvent({
        kind: 1,
        created_at: Math.floor(new Date(news.published_at).getTime() / 1000),
        tags: [],
        content
    }, sk);

    await Promise.any(pool.publish(RELAYS!, event));
}
