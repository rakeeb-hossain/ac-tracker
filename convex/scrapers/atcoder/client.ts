import axios, { AxiosError, AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { parse } from "node-html-parser";
import { Id } from "../../_generated/dataModel";

axios.defaults.withCredentials = true;

const ATCODER_PREFIX = "https://atcoder.jp";
const LOGIN_URL =`${ATCODER_PREFIX}/login`;
const CSRF_PREFIX = "var csrfToken = ";

const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8000;
const MAX_RETRIES = 3;

export type PlatformType = "AtCoder";

export type Contest = {
    ts: number,
    href?: string,
    name: string,
    platform: PlatformType,
};

export type Problem = {
    contest_id: Id<"contests">,
    id: string,
    href?: string,
    name: string,
}

async function retryWithExponentialBackoff<T>(fn: () => T, log=false, codes_to_ignore=[404]): Promise<T | null> {
    let numFailures = 0;

    for (;;) {
        try {
            return await fn();
        } catch (e) {
            if (log) {
                console.error(e);
            }
            if (e instanceof AxiosError && e.status && codes_to_ignore.includes(e.status)) {
                return null;
            }
            const timeout = Math.min(INITIAL_BACKOFF_MS*(2**numFailures), MAX_BACKOFF_MS);
            await new Promise((resolve) => {
                setTimeout(resolve, timeout);
            });

            numFailures += 1;
            if (numFailures === MAX_RETRIES) throw e;
        }
    }
}

export class ACClient {
    authedClient: AxiosInstance;
    plainClient: AxiosInstance;
    csrf_token?: string;

    constructor() {
        // construct client
        const jar = new CookieJar();
        this.plainClient = axios;
        this.authedClient = wrapper(axios.create({ jar }));
    }

    async login(username: string, password: string) {
        await retryWithExponentialBackoff(async () => await this._login(username, password), true, []);
    }

    private async _login(username: string, password: string) {
        const loginResp = await this.authedClient.get(LOGIN_URL);
        if (!loginResp.data) {
            throw new Error("login response data missing");
        }

        // Get CSRF token
        const csrf_token: string | null = ((data: string) => {
            for (const candLine of data.split('\n')) {
                const line = candLine.trim();
                if (line.startsWith(CSRF_PREFIX)) {
                    return line.slice(CSRF_PREFIX.length);
                }
            }
            return null;
        })(loginResp.data);
        if (!csrf_token) {
            throw new Error("failed to fetch CSRF token");
        }
        this.csrf_token = csrf_token;

        // Post login response
        const form = new FormData();
        form.append('username', username);
        form.append('password', password);
        form.append('csrf_token', this.csrf_token!);
        const loginPostResp = await this.authedClient.post(LOGIN_URL, form);
        if (loginPostResp.status >= 300) {
            throw new Error(loginResp.statusText);
        }
    }

    async list_contests(): Promise<Contest[]> {
        let page = 1;
        let contests: Contest[] = [];
        for (;;) {
            const url = `${ATCODER_PREFIX}/contests/archive?lang=en&page=${page}`;
            const resp = await retryWithExponentialBackoff(async () => await this.plainClient.get(url));
            if (!resp || resp.data.includes("No contests")) {
                break;
            }

            // Parse contest
            contests = contests.concat(parseContents(resp.data));
            page += 1;
        }

        return contests;
    }

    async list_problems_for_contest(contest_href: string, contest_id: Id<"contests">): Promise<Problem[]> {
        let problems: Problem[] = [];

        const tasks_url = `${ATCODER_PREFIX}/${contest_href}/tasks`;
        const resp = await retryWithExponentialBackoff(async () => await this.plainClient.get(tasks_url));
        if (!resp) return [];

        problems = problems.concat(parseProblems(resp.data, contest_id));
        return problems;
    }
}

const parseContents = (html: string): Contest[] => {
    const root = parse(html);
    const tbody = root.getElementsByTagName('tbody')[0];
    const res = tbody.getElementsByTagName('tr').map((tr) => {
        const tds = tr.getElementsByTagName('td');

        const ts = tds[0].firstChild.childNodes[0].innerText;
        const contest_a = tds[1].getElementsByTagName('a')[0];
        let href = contest_a.getAttribute('href');
        if (href) {
            href = href.slice(1); // remove leading slash
        }

        return {ts: new Date(ts).getTime(), href, name: contest_a.innerText, platform: "AtCoder" as PlatformType};
    });
    return res;
}

const parseProblems = (html: string, contest_id: Id<"contests">): Problem[] => {
    const root = parse(html);
    const tbody = root.getElementsByTagName('tbody')[0];
    const res = tbody.getElementsByTagName('tr').map((tr) => {
        const tds = tr.getElementsByTagName('td');

        const letter = tds[0].firstChild.innerText;
        let href = tds[0].getElementsByTagName('a')[0].getAttribute('href');
        if (href) {
            href = href.slice(1); // remove leading slash
        }
        const name = tds[1].firstChild.innerText;

        return {
            contest_id,
            id: letter,
            href,
            name,
        };
    });
    return res;
}