import { Icon, StatusTag } from '../../components/ui/index.js';
import { ExplainerVideo } from './ExplainerVideo.jsx';
import './mcp-film.css';

// "Kinwell in Claude": a short film of the MCP server (mcp/) at work, played by the same player as
// the homepage walkthrough. Each scene is a chat with Kinwell's tools switched on.

const at = (d) => ({ '--d': `${d}s` });

function ChatWindow({ who, children }) {
  return (
    <div className="mc-window ex-in" style={at(0)}>
      <div className="mc-window__bar">
        <span className="mc-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mc-window__title">Chat with Claude</span>
        <span className="mc-connected">
          <span className="mc-connected__dot" /> Kinwell · {who}
        </span>
      </div>
      <div className="mc-window__body">{children}</div>
    </div>
  );
}

const Ask = ({ d, children }) => (
  <div className="mc-ask ex-in" style={at(d)}>
    {children}
  </div>
);

function Tool({ d, name, detail }) {
  return (
    <div className="mc-tool ex-slide" style={at(d)}>
      <span className="mc-tool__icon" aria-hidden="true">
        <Icon name="refresh" size={13} />
      </span>
      <code>{name}</code>
      {detail && <span className="mc-tool__detail">{detail}</span>}
      <span className="mc-tool__ok ex-pop" style={at(d + 0.5)}>
        <Icon name="check" size={13} strokeWidth={3} />
      </span>
    </div>
  );
}

const Answer = ({ d, children }) => (
  <div className="mc-answer ex-in" style={at(d)}>
    {children}
  </div>
);

function ConnectScene() {
  const tools = ['get_today', 'get_client', 'get_inbox', 'log_visit', 'save_plan', 'publish_plan', 'send_family_update'];
  return (
    <div className="mc-terminal ex-in" style={at(0)}>
      <div className="mc-terminal__bar" aria-hidden="true">
        <span className="mc-dots">
          <i />
          <i />
          <i />
        </span>
        Terminal
      </div>
      <div className="mc-terminal__line">
        <span className="mc-prompt">$</span>
        <span className="mc-typing" style={at(0.5)}>
          claude mcp add kinwell -- node kinwell/mcp/src/index.js
        </span>
      </div>
      <div className="mc-terminal__out ex-in" style={at(2.4)}>
        Added stdio MCP server <b>kinwell</b>
      </div>
      <div className="mc-terminal__line ex-in" style={at(2.9)}>
        <span className="mc-prompt">$</span> claude mcp list
      </div>
      <div className="mc-terminal__out mc-terminal__ok ex-in" style={at(3.4)}>
        kinwell — ✔ Connected · signed in as Hina Qureshi, nutritionist · 13 tools
      </div>
      <div className="mc-chips">
        {tools.map((t, i) => (
          <code key={t} className="ex-pop" style={at(3.9 + i * 0.12)}>
            {t}
          </code>
        ))}
      </div>
    </div>
  );
}

function BriefingScene() {
  return (
    <ChatWindow who="Hina, nutritionist">
      <Ask d={0.4}>Brief me for today’s visits</Ask>
      <Tool d={1.1} name="get_today" detail="3 visits" />
      <Tool d={1.5} name="get_client" detail="Fatima Rahman, Tariq Rahman, Zubaida Khan" />
      <Tool d={1.9} name="get_inbox" detail="1 waiting" />
      <Answer d={2.8}>
        <p className="strong">Three visits today, in order:</p>
        <ul className="mc-list">
          <li className="ex-in" style={at(3.1)}>
            <b>11:00 Fatima Rahman</b> — fasting sugar 112, coming down <StatusTag status="watch" size="sm" />
          </li>
          <li className="ex-in" style={at(3.5)}>
            <b>12:00 Tariq Rahman</b> — BP 150/96 last time, recheck <StatusTag status="attention" size="sm" />
          </li>
          <li className="ex-in" style={at(3.9)}>
            <b>3:00 Zubaida Khan</b> — asked to move to Friday
          </li>
        </ul>
        <p className="mc-muted ex-in" style={at(4.3)}>
          Sana asked about Ammi’s ankle swelling and is waiting for a reply.
        </p>
      </Answer>
    </ChatWindow>
  );
}

function ApprovalScene() {
  return (
    <ChatWindow who="Hina, nutritionist">
      <Ask d={0.3}>Log today’s visit for Fatima: BP 128/82, sugar 112, weight 63.5. She’s doing well.</Ask>
      <div className="mc-approve ex-in" style={at(1.2)}>
        <div className="mc-approve__head">
          <Icon name="lock" size={16} /> Allow <code>log_visit</code>?
        </div>
        <p>This records the visit and tells Fatima’s family.</p>
        <div className="mc-approve__actions ex-swap">
          <span className="mc-approve__buttons ex-out" style={{ '--o': '2.9s' }}>
            <span className="mc-btn">Deny</span>
            <span className="mc-btn mc-btn--primary">Allow</span>
          </span>
          <span className="mc-allowed ex-pop" style={at(2.9)}>
            <Icon name="checkCircle" size={16} /> Allowed
          </span>
          <span className="ex-tap" style={{ '--d': '2.5s', right: '6px' }} />
        </div>
      </div>
      <Tool d={3.3} name="log_visit" detail="Fatima Rahman" />
      <Answer d={4}>
        <p>
          Saved. Blood pressure <StatusTag status="normal" size="sm" /> sugar <StatusTag status="watch" size="sm" />
        </p>
        <p className="mc-muted">Sana and Bilal have the visit note.</p>
      </Answer>
    </ChatWindow>
  );
}

function FamilyScene() {
  return (
    <ChatWindow who="Sana, family">
      <Ask d={0.4}>How was Ammi’s week?</Ask>
      <Tool d={1.1} name="list_parents" />
      <Tool d={1.5} name="get_parent_dashboard" detail="Ammi" />
      <Tool d={1.9} name="get_parent_details" detail="labs, visits" />
      <Answer d={2.8}>
        <p>
          <b>Mostly steady.</b> Her fasting sugar is down to 112 and she ticked off 26 of 28 tablets and meals.
        </p>
        <p className="ex-in" style={at(3.4)}>
          Her vitamin D is low (18.2), so Hina added a weekly supplement. Next visit: Monday, 11 am.
        </p>
        <p className="mc-muted ex-in" style={at(4)}>
          Nothing needs you this week.
        </p>
      </Answer>
    </ChatWindow>
  );
}

function TriageScene() {
  return (
    <ChatWindow who="Zara, admin">
      <Ask d={0.4}>Which flags need us first?</Ask>
      <Tool d={1.1} name="get_overview" />
      <Tool d={1.5} name="list_flags" detail="open" />
      <Answer d={2.4}>
        <ol className="mc-list">
          <li className="ex-in" style={at(2.7)}>
            <StatusTag status="attention" size="sm" /> <b>Critical result</b> — Fatima Rahman, vitamin D 14. Hina has been told.
          </li>
          <li className="ex-in" style={at(3.1)}>
            <StatusTag status="watch" size="sm" /> <b>5 unreadable reports</b> — newest from the Rahman family.
          </li>
          <li className="ex-in" style={at(3.5)}>
            <StatusTag status="watch" size="sm" /> <b>1 access request</b> — a relative asking to join.
          </li>
        </ol>
        <p className="mc-muted ex-in" style={at(4.1)}>
          I haven’t changed anything. Want me to remind Hina about the result?
        </p>
      </Answer>
    </ChatWindow>
  );
}

export const MCP_SCENES = [
  { title: 'Connect Kinwell to Claude', text: 'One command in Claude Code (or a few lines in Claude Desktop). It signs in as you and offers only the tools your role allows.', Scene: ConnectScene },
  { title: 'Ask in plain words', text: 'Claude reads Kinwell for you: today’s visits, each client’s latest readings and who is waiting for a reply.', Scene: BriefingScene },
  { title: 'It asks before telling anyone', text: 'Anything that reaches a family or the team waits for your OK. Readings are still checked and graded by Kinwell.', Scene: ApprovalScene },
  { title: 'Families ask too', text: 'Children abroad get the week in a few sentences, straight from their parent’s record, without medical jargon.', Scene: FamilyScene },
  { title: 'The team triages in seconds', text: 'Admins see what needs them first. Claude suggests the next step and changes nothing until you say so.', Scene: TriageScene },
];

export function McpFilm(props) {
  return <ExplainerVideo scenes={MCP_SCENES} label="Kinwell in Claude" {...props} />;
}
