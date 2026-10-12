// End-to-end: launches the MCP server the way Claude does (stdio), signs in as each role against a
// running Kinwell API, and calls tools through a real MCP client.
//   npm run seed -w server && npm run dev -w server   (in another terminal)
//   npm test -w mcp
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const API = process.env.KINWELL_API_URL ?? 'http://localhost:4000/api';
const SERVER = fileURLToPath(new URL('../src/index.js', import.meta.url));
const PASSWORD = 'kinwell-demo';
const clients = [];

async function connect(email, password = PASSWORD) {
  const client = new Client({ name: 'kinwell-mcp-test', version: '1.0.0' });
  const env = { PATH: process.env.PATH, KINWELL_API_URL: API, KINWELL_EMAIL: email, KINWELL_PASSWORD: password };
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [SERVER], env, stderr: 'ignore' }));
  clients.push(client);
  return client;
}
const call = async (client, name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content?.[0]?.text ?? '';
  return { isError: Boolean(r.isError), text, data: r.isError ? null : JSON.parse(text) };
};
const names = async (client) => (await client.listTools()).tools.map((t) => t.name).sort();

before(async () => {
  const up = await fetch(`${API}/health`).then((r) => r.ok, () => false);
  if (!up) throw new Error(`The Kinwell API isn't reachable at ${API}. Run "npm run seed -w server" and "npm run dev -w server" first.`);
});
after(() => Promise.all(clients.map((c) => c.close())));

describe('family member (Sana)', () => {
  let c;
  let ammi;
  before(async () => {
    c = await connect('sana.rahman@gmail.com');
  });

  test('gets only family tools and the family prompt', async () => {
    const tools = await names(c);
    assert.ok(tools.includes('get_parent_dashboard') && tools.includes('save_lab_results'));
    assert.ok(!tools.includes('list_flags') && !tools.includes('log_visit'), 'no staff tools');
    const prompts = (await c.listPrompts()).prompts.map((p) => p.name);
    assert.deepEqual(prompts, ['weekly_parent_summary']);
  });

  test('read tools are marked read-only, messaging reaches people', async () => {
    const { tools } = await c.listTools();
    const t = Object.fromEntries(tools.map((x) => [x.name, x.annotations]));
    assert.equal(t.get_parent_dashboard.readOnlyHint, true);
    assert.equal(t.send_message.readOnlyHint, false);
    assert.equal(t.send_message.openWorldHint, true);
  });

  test('whoami, parents and a dashboard', async () => {
    assert.equal((await call(c, 'whoami')).data.role, 'family');
    const parents = (await call(c, 'list_parents')).data;
    ammi = parents.find((p) => p.key === 'ammi');
    assert.ok(ammi?.id);
    const d = (await call(c, 'get_parent_dashboard', { parentId: ammi.id })).data;
    assert.ok(d.parent && Array.isArray(d.markers));
    const labs = (await call(c, 'get_parent_details', { parentId: ammi.id, section: 'labs' })).data;
    assert.ok(Array.isArray(labs.markers));
  });

  test('reads lab report text without saving', async () => {
    const r = (await call(c, 'read_lab_report', { parentId: ammi.id, text: 'CHUGHTAI LAB\nHbA1c 74 % <5.7\nVitamin D 18.2 ng/mL 30-100' })).data;
    const x = Object.fromEntries(r.results.map((y) => [y.name, y]));
    assert.equal(x.HbA1c.value, '7.4');
    assert.equal(x['Vitamin D'].status, 'attention');
  });

  test('bad input is refused before reaching Kinwell', async () => {
    const r = await c.callTool({ name: 'get_parent_dashboard', arguments: { parentId: 'not-an-id' } }).catch((e) => ({ isError: true, content: [{ text: e.message }] }));
    assert.equal(r.isError, true);
  });

  test("can't open someone else's parent", async () => {
    const r = await call(c, 'get_parent_dashboard', { parentId: '0123456789abcdef01234567' });
    assert.equal(r.isError, true);
  });

  test('a message reaches the nutritionist inbox', async () => {
    const text = `MCP test message ${Date.now()}`;
    assert.equal((await call(c, 'send_message', { parentId: ammi.id, text })).isError, false);
    const hina = await connect('hina.qureshi@kinwell.pk');
    const thread = (await call(hina, 'get_inbox')).data.threads.find((t) => t.parentId === ammi.id);
    assert.equal(thread.last, text);
    assert.equal(thread.needsReply, true);
  });
});

describe('nutritionist (Hina)', () => {
  let c;
  before(async () => {
    c = await connect('hina.qureshi@kinwell.pk');
  });

  test('gets only nutritionist tools', async () => {
    const tools = await names(c);
    assert.ok(tools.includes('get_today') && tools.includes('log_visit') && tools.includes('publish_plan'));
    assert.ok(!tools.includes('list_parents') && !tools.includes('list_flags'));
  });

  test("today's visits and a client record", async () => {
    const today = (await call(c, 'get_today')).data;
    assert.ok(today);
    const clients = (await call(c, 'list_clients')).data;
    const list = Array.isArray(clients) ? clients : clients.clients ?? clients.items;
    assert.ok(list.length > 0);
    const client = (await call(c, 'get_client', { parentId: list[0].id })).data;
    assert.ok(client);
  });

  test('an empty visit is refused with the API message', async () => {
    const clients = (await call(c, 'list_clients')).data;
    const list = Array.isArray(clients) ? clients : clients.clients ?? clients.items;
    const r = await call(c, 'log_visit', { parentId: list[0].id, vitals: [] });
    assert.equal(r.isError, true);
    assert.ok(r.text.length > 5);
  });
});

describe('admin (Zara)', () => {
  let c;
  before(async () => {
    c = await connect('zara.ahmed@kinwell.pk');
  });

  test('gets admin tools, never account-security ones', async () => {
    const tools = await names(c);
    assert.ok(tools.includes('list_flags') && tools.includes('get_overview'));
    assert.ok(!tools.some((t) => /password|sign_out|active/.test(t)));
  });

  test('overview and open flags', async () => {
    assert.ok((await call(c, 'get_overview')).data);
    const flags = (await call(c, 'list_flags', { state: 'open' })).data;
    assert.ok(flags);
  });
});

describe('sign-in problems', () => {
  test('a wrong password still starts, and whoami explains', async () => {
    const c = await connect('sana.rahman@gmail.com', 'wrong-password');
    const r = await call(c, 'whoami');
    assert.equal(r.isError, true);
    assert.match(r.text, /password|sign in|email/i);
  });
});
