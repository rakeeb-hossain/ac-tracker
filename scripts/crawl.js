const axios = require('axios');
const wrapper = require('axios-cookiejar-support').wrapper;
const CookieJar = require('tough-cookie').CookieJar;
const parse = require('node-html-parser').parse;

axios.defaults.withCredentials = true
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

const extract_csrf_token = (body) => {
	const prefix = 'var csrfToken = "';
	for (const _line of body.split('\n')) {
		const line = _line.trim();
		if (line.startsWith(prefix)) {
			return line.slice(prefix.length, -1);
		}
	}
	return null;
}

(async () => {
 /*
	const resp = await client.get('https://atcoder.jp/login');
	if (!resp.data) {
		throw new Error("resp body nil");
	}
	const csrf = extract_csrf_token(resp.data);

	const form = new FormData();
	form.append('username', 'actracker');
	form.append('password', 'convex123');
	form.append('csrf_token', csrf);
	const postRes = await client.post('https://atcoder.jp/login', form);
*/

	let page = 1;
	for (;;) {
		const resp = await client.get(`https://atcoder.jp/contests/archive?lang=en&page=${page}`);
		if (resp.data.includes("No contests")) {
			break;
		}

		const root = parse(resp.data);
		const tbody = root.getElementsByTagName('tbody')[0];
		const info = tbody.getElementsByTagName('tr').map((tr) => {
			const tds = tr.getElementsByTagName('td');
			
			const ts = tds[0].firstChild.childNodes[0].innerText;
			const contest_a = tds[1].getElementsByTagName('a')[0];
			const href = contest_a.getAttribute('href');

			return {ts: new Date(ts), href, name: contest_a.innerText}
		});
		console.log(info);



		break;
		page += 1;
	}

})();

