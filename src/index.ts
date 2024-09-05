import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fetchNews } from './osu.js';
import log from './log.js';
import { postNews } from './nostr.js';
import { setTimeout } from 'node:timers/promises';

function getLastUpdate() {
    if (existsSync('last_update.json')) {
        const { date } = JSON.parse(readFileSync('last_update.json', 'utf-8'));
        return new Date(date);
    }

    // If this is the first time we are running the program
    // try to set a good default so it doesn't just
    // go crazy and post the entire feed.
    // Let's say we check for news for the last 3 days to begin with.
    return Date.now() - 86400000 * 3;
}

async function getLatestNews() {
    const posts = await fetchNews();
    const last = getLastUpdate();

    // Filter for new posts since our last checked time.
    return posts.filter((post) => new Date(post.published_at) > last).reverse();
}

while (true) {
    log.info('Checking for updates...');

    try {
        const news = await getLatestNews();

        for (const post of news) {
            log.info('Posting to nostr...');
            await postNews(post);
            log.info(`Posted note successfully: ${post.title}`);
            // give it a break between posts.
            await setTimeout(30 * 1000);
        }

        // Update the timestamp to current date.
        writeFileSync('last_update.json', JSON.stringify({ date: new Date() }));
    } catch (err) {
        log.error('Failed to check for updates.', err);
    }

    // check every 12 hours.
    await setTimeout(12 * 60 * 60 * 1000);
}
