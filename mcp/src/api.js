// Small client for the Kinwell REST API, used by the MCP tools.
// Signs in with KINWELL_TOKEN, or with KINWELL_EMAIL + KINWELL_PASSWORD (and signs in again once if
// the session expires). Never writes to stdout: in stdio mode that channel belongs to MCP.

export class KinwellError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class KinwellClient {
  constructor({ baseUrl, token, email, password, language, fetchImpl = fetch } = {}) {
    this.baseUrl = (baseUrl ?? 'https://kinwell-sepia.vercel.app/api').replace(/\/$/, '');
    this.token = token || null;
    this.email = email;
    this.password = password;
    this.language = language;
    this.fetch = fetchImpl;
    this.user = null;
  }

  static fromEnv(env = process.env) {
    return new KinwellClient({
      baseUrl: env.KINWELL_API_URL,
      token: env.KINWELL_TOKEN,
      email: env.KINWELL_EMAIL,
      password: env.KINWELL_PASSWORD,
      language: env.KINWELL_LANGUAGE,
    });
  }

  get canSignIn() {
    return Boolean(this.email && this.password);
  }

  async signIn() {
    if (!this.canSignIn) throw new KinwellError('Set KINWELL_EMAIL and KINWELL_PASSWORD (or KINWELL_TOKEN) for the Kinwell MCP server.', 401);
    const { token, user } = await this.request('POST', '/auth/login', { email: this.email, password: this.password }, { auth: false });
    this.token = token;
    this.user = user;
    return user;
  }

  /** The signed-in account ({ id, name, role, ... }), signing in first if needed. */
  async me() {
    if (!this.token) await this.signIn();
    if (!this.user) this.user = (await this.request('GET', '/auth/me')).user;
    return this.user;
  }

  async request(method, path, body, { auth = true, query, retried = false } = {}) {
    if (auth && !this.token) await this.signIn();
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;
    if (this.language) headers['X-Language'] = this.language;

    let res;
    try {
      res = await this.fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20_000) });
    } catch (err) {
      throw new KinwellError(`Couldn't reach Kinwell at ${this.baseUrl} (${err.cause?.code ?? err.name}).`, 0);
    }
    const data = await res.json().catch(() => null);
    if (res.status === 401 && auth && !retried && this.canSignIn) {
      // Session expired or signed out elsewhere: sign in again once.
      this.token = null;
      this.user = null;
      await this.signIn();
      return this.request(method, path, body, { auth, query, retried: true });
    }
    if (!res.ok) {
      const e = data?.error ?? {};
      throw new KinwellError(e.message ?? `Kinwell answered ${res.status}`, res.status, e.details);
    }
    return data;
  }

  get = (path, query) => this.request('GET', path, undefined, { query });
  post = (path, body = {}) => this.request('POST', path, body);
  put = (path, body = {}) => this.request('PUT', path, body);
  patch = (path, body = {}) => this.request('PATCH', path, body);
}
