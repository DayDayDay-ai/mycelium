import https from 'node:https';
import http from 'node:http';
const addresses = new Map();
async function resolve(host) {
  if (addresses.has(host) && Date.now() - addresses.get(host).time < 30000) return addresses.get(host).ip;
  const raw = await request(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=A`, { address: '1.1.1.1', headers: { accept: 'application/dns-json' } });
  const candidates = JSON.parse(raw.body).Answer?.filter(x => x.type === 1).map(x => x.data) || [];
  const ip = candidates.find(x => /^52\.|^54\./.test(x)) || candidates[0];
  if (!ip) throw new Error(`DNS: ${host}`);
  addresses.set(host, { ip, time: Date.now() }); return ip;
}
export async function request(url, opts = {}, attempt = 0) {
  const host = new URL(url).hostname;
  const address = opts.address || await resolve(host);
  let deadline;
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('http:') ? http : https).get(url, { maxVersion: 'TLSv1.2', headers: { 'User-Agent': 'MyceliumEducationalCatalog/1.0 (local educational project)', ...opts.headers }, lookup: (h, o, cb) => cb(null, o.all ? [{ address, family: 4 }] : address, 4) }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); resolve(request(new URL(res.headers.location, url).href)); return; }
      const chunks = []; res.on('data', b => chunks.push(b)); res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), type: res.headers['content-type'] })); res.on('error', reject);
    });
    deadline = setTimeout(() => { reject(new Error('Request timeout')); req.destroy(); }, opts.timeout || 12000);
    req.on('error', reject);
  }).finally(() => clearTimeout(deadline)).catch(error => {
    if (attempt >= 1) throw error;
    addresses.delete(host);
    return request(url, opts, attempt + 1);
  });
}
