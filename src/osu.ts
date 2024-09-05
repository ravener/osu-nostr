import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import log from './log.js';

const TOKEN_URL = 'https://osu.ppy.sh/oauth/token';
const USER_AGENT = 'osu-nostr https://github.com/ravener/osu-nostr';
let cachedToken: { access_token: string; expires_in: number };

async function getToken(): Promise<string> {
    if (cachedToken || existsSync('osu.json')) {
        cachedToken ??= JSON.parse(readFileSync('osu.json', 'utf-8'));
        const { mtime } = statSync('osu.json');

        if (Date.now() - mtime.getTime() < cachedToken.expires_in * 1000) {
            log.info('Found cached osu! token');
            return cachedToken.access_token;
        }

        log.info('Cached osu! token is expired requesting new token.');
    }

    log.info('Requesting osu! api credentials grant.');
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: process.env.CLIENT_ID!,
            client_secret: process.env.CLIENT_SECRET!,
            grant_type: 'client_credentials',
            scope: 'public'
        })
    });

    if (response.status !== 200) {
        throw new Error(`Got status code ${response.status}`);
    }

    const token = await response.json();
    writeFileSync('osu.json', JSON.stringify(token, null, 2));
    cachedToken = token.access_token;
    return token.access_token;
}

async function request<T>(endpoint: string): Promise<T> {
    const token = await getToken();

    const response = await fetch(`https://osu.ppy.sh/api/v2${endpoint}`, {
        headers: {
            'User-Agent': USER_AGENT,
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status !== 200) {
        throw new Error(`Failed to fetch news: ${response.status}`);
    }

    return response.json();
}

export interface NewsPost {
    id: string;
    author: string;
    edit_url: string;
    first_image: string;
    published_at: string;
    updated_at: string;
    slug: string;
    title: string;
    preview: string;
}

export interface News {
    news_posts: NewsPost[];
}

export async function fetchNews(): Promise<NewsPost[]> {
    const response = await request<News>('/news');
    return response.news_posts;
}
