import { cyan, red, yellow, magenta } from 'colorette';

function log(tag: string, color: (text: string, ...args: unknown[]) => string, ...args: unknown[]) {
    console.log(color(`[${tag.toUpperCase().padEnd(5, ' ')}]`), ...args);
}

export default {
    info: log.bind(null, 'info', cyan),
    error: log.bind(null, 'error', red),
    warn: log.bind(null, 'warn', yellow),
    debug: log.bind(null, 'debug', magenta)
};
