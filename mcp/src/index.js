#!/usr/bin/env node
// Kinwell MCP server (stdio). Lets Claude Desktop, Claude Code or any MCP client work with Kinwell
// as the account in KINWELL_EMAIL / KINWELL_PASSWORD (or KINWELL_TOKEN): a family member, a
// nutritionist or an admin. Only that role's tools are offered, and the API enforces permissions.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { KinwellClient } from './api.js';
import { registerAdminTools, registerCommonTools, registerFamilyTools, registerNutritionistTools, TOOLS_FOR_ROLE } from './tools.js';

const PROMPTS = {
  family: {
    name: 'weekly_parent_summary',
    title: "This week for my parent",
    description: "A short, plain-language summary of how a parent's week went and what (if anything) needs you.",
    args: { parentName: z.string().optional().describe('Which parent, e.g. "Ammi". Leave empty to cover all.') },
    text: ({ parentName }) =>
      `Using the Kinwell tools, give me a short summary of how ${parentName ?? 'each of my parents'} is doing this week. Start with list_parents, then the dashboard, labs and visits for each. Say plainly what is going well, anything marked watch or needs attention and what the nutritionist is already doing about it, and whether I need to do anything. Don't give medical advice beyond what Kinwell shows.`,
  },
  nutritionist: {
    name: 'prepare_for_today',
    title: "Prepare for today's visits",
    description: "A briefing for each of today's home visits: what changed, what to check, open questions from the family.",
    args: {},
    text: () =>
      "Using the Kinwell tools, brief me for today's home visits. Call get_today, then get_client for each visit in order. For each one: the latest readings and labs with anything on watch or needing attention, what changed since the last visit, supplements and plan status, and unanswered family messages (from get_inbox). Finish with reschedule requests waiting for an answer. Keep each client to a few lines.",
  },
  admin: {
    name: 'triage_flags',
    title: 'Triage open flags',
    description: 'Open flags sorted by urgency, with a suggested next step for each.',
    args: {},
    text: () =>
      'Using the Kinwell tools, triage the open flags. Call get_overview and list_flags (state open). Group them by urgency (critical results first), say for each what happened and who should act, and suggest a next step. Do not resolve or send anything until I confirm.',
  },
};

async function main() {
  const api = KinwellClient.fromEnv();
  const server = new McpServer({ name: 'kinwell', version: '1.0.0' }, { instructions: 'Kinwell is home nutrition care for older parents in Lahore. Tools act as the signed-in account. Results are graded normal / watch / attention. Ask before sending messages or saving changes the user has not asked for.' });

  // Sign in first so only this account's tools are offered. If that fails, offer every tool:
  // the API still refuses anything the account isn't allowed to do, and whoami shows the problem.
  let role = null;
  try {
    role = (await api.me()).role;
  } catch (err) {
    console.error(`[kinwell-mcp] Couldn't sign in yet: ${err.message}`);
  }

  registerCommonTools(server, api);
  for (const register of TOOLS_FOR_ROLE[role] ?? [registerFamilyTools, registerNutritionistTools, registerAdminTools]) register(server, api);

  for (const [r, p] of Object.entries(PROMPTS)) {
    if (role && r !== role) continue;
    server.registerPrompt(p.name, { title: p.title, description: p.description, argsSchema: p.args }, (args) => ({
      messages: [{ role: 'user', content: { type: 'text', text: p.text(args ?? {}) } }],
    }));
  }

  await server.connect(new StdioServerTransport());
  console.error(`[kinwell-mcp] Ready (${role ?? 'not signed in'}) against ${api.baseUrl}`);
}

main().catch((err) => {
  console.error('[kinwell-mcp] Failed to start:', err);
  process.exit(1);
});
