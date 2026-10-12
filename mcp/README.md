# Kinwell MCP server

Lets Claude (Claude Desktop, Claude Code) or any other MCP client work with Kinwell as a real
account: a **family member**, a **nutritionist** or an **admin**. Ask things like *"How was Ammi's
week?"*, *"Brief me for today's visits"* or *"Which flags need us first?"*, and Claude calls Kinwell for
you.

- It signs in as one Kinwell account and offers **only that role's tools**. The Kinwell API checks
  every call, so Claude can only do what that person could do in the app.
- Read tools are marked read-only. Tools that change data are marked as writes, and tools that also
  reach people (messages, published plans, visit notes) are marked open-world, so clients can ask
  before running them.
- Account-security actions (resetting passwords, signing people out, turning accounts off) are
  **not** exposed.
- Runs locally over stdio and talks to the live API (or your local one).

## Set up

You need Node 20+ and this repository (`npm install` at the repo root installs the server too).

| Variable | |
| --- | --- |
| `KINWELL_EMAIL`, `KINWELL_PASSWORD` | The account to act as (family, nutritionist or admin). |
| `KINWELL_TOKEN` | Instead of a password: a Kinwell session token. |
| `KINWELL_API_URL` | Default `https://kinwell-sepia.vercel.app/api`. Use `http://localhost:4000/api` for local development. |
| `KINWELL_LANGUAGE` | `ur` to get parent-facing content in Urdu. |

Use a real person's own account, not a shared one: everything Claude does is recorded as that person.

### Claude Code

```bash
claude mcp add kinwell -e KINWELL_EMAIL=you@example.com -e KINWELL_PASSWORD='your-password' -- node "/Users/haroonriasat-amplon/Airplane game /kinwell/mcp/src/index.js"
```

### Claude Desktop

Settings → Developer → Edit Config, then add to `claude_desktop_config.json` and restart Claude:

```json
{
  "mcpServers": {
    "kinwell": {
      "command": "node",
      "args": ["/Users/haroonriasat-amplon/Airplane game /kinwell/mcp/src/index.js"],
      "env": {
        "KINWELL_EMAIL": "you@example.com",
        "KINWELL_PASSWORD": "your-password"
      }
    }
  }
}
```

If Claude Desktop says it can't find `node`, replace `"node"` with the full path from `which node`.
Keep the path exactly as written: the `Airplane game ` folder name ends with a space.

## Tools

**Everyone:** `whoami`

**Family member** — `list_parents`, `get_parent_dashboard`, `get_parent_details` (profile, labs,
nutrition, supplements, visits, documents, messages), `read_lab_report` (finds results in pasted report
text, saves nothing), `save_lab_results`, `send_message`, `request_reschedule`, `set_checklist_item`.
Prompt: **weekly_parent_summary**.

**Nutritionist** — `get_today`, `get_inbox`, `get_notifications`, `list_clients`, `get_client`,
`get_food_library`, `get_plan`, `save_plan`, `publish_plan`, `log_visit`, `answer_reschedule`,
`send_family_update`. Prompt: **prepare_for_today**.

**Admin** — `get_overview`, `list_flags`, `resolve_flag`, `reopen_flag`, `add_flag_note`,
`send_flag_reminder`, `list_families`, `get_family`, `assign_nutritionist`, `list_nutritionists`,
`get_nutritionist`, `list_unreadable_reports`, `handle_unreadable_report`, `list_access_requests`,
`decide_access_request`, `get_activity`. Prompt: **triage_flags**.

## Test it

Everything below uses the local demo data, so no real family is affected. Start the database and API
first (from the `kinwell` folder):

```bash
npm run db:up && npm run seed -w server && npm run dev -w server
```

Every demo account uses the password `kinwell-demo`: `sana.rahman@gmail.com` (family),
`hina.qureshi@kinwell.pk` (nutritionist), `zara.ahmed@kinwell.pk` (admin).

### 1. Automated tests

```bash
npm test -w @kinwell/mcp
```

Starts the server as each role through a real MCP client and calls its tools. Expect `# pass 13`.

### 2. MCP Inspector (click through the tools in a browser)

```bash
npx @modelcontextprotocol/inspector -e KINWELL_API_URL=http://localhost:4000/api -e KINWELL_EMAIL=hina.qureshi@kinwell.pk -e KINWELL_PASSWORD=kinwell-demo node mcp/src/index.js
```

(`npm run inspect -w @kinwell/mcp` does the same as Hina.) Click **Connect**, then **Tools → List Tools**, pick one (e.g. `get_today`) and **Run Tool**.
**Prompts** shows the role's ready-made prompt.

### 3. With Claude Code

```bash
claude mcp add kinwell-local -e KINWELL_API_URL=http://localhost:4000/api -e KINWELL_EMAIL=hina.qureshi@kinwell.pk -e KINWELL_PASSWORD=kinwell-demo -- node "/Users/haroonriasat-amplon/Airplane game /kinwell/mcp/src/index.js"
claude mcp list        # should show: kinwell-local ... ✔ Connected
```

Then open a **new** Claude Code session in the same project (servers load when a session starts),
run `/mcp` to see its 13 tools, and try:

- "Use the whoami tool" → Hina Qureshi, nutritionist
- "Brief me for today's visits"
- "Who's waiting for a reply?"
- "Log a visit for Fatima Rahman: BP 128/82, fasting sugar 112, weight 63.5, she's doing well" —
  Claude should check with you first, because this notifies the family. Sign in at
  http://localhost:5173 as Sana to see the visit card in Fatima's messages.

To try another role, add it again under another name (e.g. `kinwell-sana` with Sana's email). Remove
with `claude mcp remove kinwell-local -s local`. If tools don't appear, `/mcp` shows the connection
status and `whoami` explains sign-in problems.

Code: `src/api.js` (Kinwell API client: sign-in, re-sign-in on expiry, readable errors),
`src/tools.js` (tools per role), `src/index.js` (server, role detection, prompts).

## Health data

Tool results contain the parent's health information and go to whichever AI model the MCP client
uses. Only connect accounts whose families have agreed to that, and keep it to people who need it.
