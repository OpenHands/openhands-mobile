# OpenHands Mobile — planning notes

Status: Expo MVP in progress (direct host + session key, list + chat).  
Last updated: 2026-09-16.

This document is the working agreement for `openhands-mobile`. It records
why the repo exists, what the phone is (and is not), and how work should
be split across OpenHands repositories.

## 1. Product

A phone and tablet app that can:

1. **Remote-control OpenHands that is already running on a laptop.**  
   The laptop keeps its active backend (local agent-server, a remote
   agent-server, or OpenHands Cloud) and whatever LLM / profile is
   already selected. The phone is a second screen for that process.
2. **Talk to a backend directly when there is no laptop.**  
   OpenHands Cloud (SaaS) or a user-supplied agent-server URL. This is a
   separate mode, not the laptop path with Cloud substituted in.

Both modes share one chat UI. They must not share one connection object.

Tablet and phone are the same binary: list → chat on a phone, master–detail
on a tablet.

### 1.1 What the user can do in v1

- Pair to a running laptop OpenHands session.
- List, open, create, and continue conversations that session already owns.
- Send messages and stream events.
- See a clear offline state when the laptop sleeps or OpenHands quits.
- Optionally use Cloud or a custom agent-server with no laptop involved.

### 1.2 What the user cannot do in v1

- Configure LLM providers, MCP, skills, or git tokens on the phone.
- Port Files, Terminal, Browser, Monaco, or xterm.
- Silently fail over from “laptop remote control” to “new Cloud sandbox.”
- Use Siri, widgets, CarPlay, or ChatGPT-style always-on voice.

## 2. Core rule: the laptop is the control plane

Remote control is **not** “the phone logs into OpenHands Cloud.”

The phone attaches to **the OpenHands process on the laptop**. It inherits
that process’s backend registry entry and active LLM. A local-only user
with an Anthropic (or other) key and no OpenHands Cloud account must still
be able to remote-control their laptop.

```
Phone  ── LAN or outbound relay ──►  Laptop OpenHands (ingress / facade)
                                         │
                                         ├─ backend = local  →  local agent-server
                                         │                      (that LLM, that workspace)
                                         └─ backend = cloud  →  Cloud APIs / sandbox
                                                                (that org, that LLM)
```

Today Agent Canvas already branches this way. When the active backend is
`local`, conversations live on that agent-server. When it is `cloud`,
conversations live on Cloud; the laptop local agent-server does **not**
own them.

So the phone must not:

- Always call the laptop’s raw `/api/conversations` (misses Cloud-on-laptop).
- Always call OpenHands Cloud (misses local-only laptops and the active LLM).

The laptop must expose a **unified remote-session API** that reuses the
same local-vs-cloud branch Canvas already has. The phone speaks one
protocol to the laptop. The laptop keeps talking to whatever it was
already talking to.

### 2.1 Two phone entry points (keep them separate)

| Mode | Requires laptop? | Auth | LLM / backend |
|---|---|---|---|
| **This laptop** | Yes, OpenHands running | Device pairing | Inherited from the laptop |
| **Direct backend** | No | Device flow (SaaS) or host + API key | That backend’s settings |

If these are merged, local-only users get stuck behind a Cloud login, and
Cloud-on-laptop users get a second, empty session.

## 3. Reaching the laptop without LAN

Do not port-forward agent-server to the public internet. The laptop can
run a coding agent on the user’s machine; inbound `:8000` is the wrong
model.

Both sides make **outbound** connections:

```
Phone  --outbound-->  Relay  <--outbound--  Laptop
```

The relay is a dumb pipe plus presence (“is Paul’s Mac online?”). It does
not store conversations, LLM keys, or backend kind.

### 3.1 Transports (in order of when we should use them)

1. **Same LAN** — QR / typed IP + pairing token. Fine for the first spike.
2. **User overlay** — Tailscale (or similar). Internet without building a
   relay. Mobile code is still host + credential.
3. **User tunnel** — Cloudflare Tunnel / ngrok. Escape hatch; already
   documented in Agent Canvas remote-backend setup.
4. **Optional OpenHands device relay** — convenience pipe so LTE works
   without Tailscale. **Not** the SaaS conversation API. Sign-in here, if
   any, is only “which laptops did I pair.”
5. **Self-hosted relay** — same protocol as (4) for people who will not
   use a hosted pipe.

(4) may share Cloud *infrastructure*. It must not become “your remote
session is a Cloud conversation.”

### 3.2 Pairing

Laptop shows a QR, e.g. `openhands://pair?relay=…&device=…&token=…`.
The phone stores a device credential for **that machine**. Next launch
asks “is this laptop online?”, not “log into Cloud.”

Do not put the long-lived agent-server session API key on a projector or
a public hostname. Use short-lived pairing tokens; mint a device
credential after success.

iOS needs Local Network usage text and an ATS exception for LAN HTTP.
Android needs cleartext permission for the same case. These are `app.json`
/ config-plugin flags, not a second codebase.

### 3.3 Offline

Lid closed or OpenHands quit → remote control is dead. Show that. Direct
Cloud mode is an explicit user choice, not a silent fallback that starts
a new sandbox agent.

## 4. Stack

**One Expo (React Native) TypeScript app** for iPhone, Android phone, iPad,
and Android tablet.

OpenAI and Anthropic shipped separate native Swift / Kotlin clients. That
is the right choice at their scale (Siri, LiveKit voice orbs, IAP,
CarPlay). It is the wrong tax for this MVP. Copy their *product shape*
(thin chat client, do not wrap the website), not their language split.

### 4.1 Expo coverage for what we need

| Capability | Use |
|---|---|
| Camera + QR | `expo-camera` |
| Mic (later) | `expo-audio` |
| Photos / files | `expo-image-picker`, `expo-document-picker` |
| HTTPS + WebSocket | RN `fetch` / `WebSocket` (no browser CORS) |
| LAN HTTP | ATS + Android cleartext + Local Network plist |
| Secure keys | `expo-secure-store` |
| Deep links | `expo-linking` (`openhands://`) |
| Push (later) | `expo-notifications` + a real binary |
| Tablet layout | Same screens, split view when wide |

Not required for years: App Intents, widgets, CarPlay, custom Metal,
first-class Bonjour. mDNS is optional; QR + typed IP is enough.

Use Expo Go only to sketch UI. Pairing, voice, and push need a
development / production build (`npx expo run:*` or EAS).

`Platform.select` and Info.plist / manifest keys are config, not a second
app. Write a native module only if a later feature has no Expo path.

### 4.2 What we will not do

- Wrap Agent Canvas in Capacitor / a WebView as the product.
- Import `@openhands/agent-canvas` into React Native (peer deps are
  `react-dom` and `react-router`; UI is Tailwind / HeroUI / Monaco / xterm).
- Reimplement agent-server HTTP by hand. Use
  `@openhands/typescript-client` (spike this in RN before building screens).
- Put provider API keys in the mobile bundle.

## 5. How much of Agent Canvas is portable

Canvas is portable to **other web hosts**, not to native UI.

| Layer | Reuse in this repo |
|---|---|
| `@openhands/typescript-client` | Yes — primary dependency |
| Agent-server types / event guards | Yes |
| `groupEvents`, render-eligibility, action titles | Yes (copy or extract) |
| Backend kinds (`local` \| `cloud`), device-flow client | Yes (ideas + thin wrappers) |
| i18n keys for chat / backends | Yes (react-i18next works in RN) |
| Version floor (`assertAgentServerVersionIsSupported`) | Yes |
| Telemetry event names | Yes; not `posthog-js` as-is |
| Canvas `src/api` Cloud proxy | **No** — browsers need it; native does not, and laptop remote control must not assume it |
| Chat / settings / files UI | **No** — rewrite |

Steal protocol and product rules. Do not steal screens.

Canvas already has narrow-viewport layouts (`settings-mobile-drawer`,
`conversation-mobile-panel-page`). Those are web, not React Native.

## 6. Repository map

This repo is **only** the mobile client.

| Repo | Owns |
|---|---|
| **`OpenHands/openhands-mobile`** (this) | Expo app, pairing client, SecureStore, chat UI, laptop vs direct-backend modes |
| **`OpenHands/OpenHands`** (Agent Canvas) | “Allow remote access”, QR, unified remote-session facade, LAN bind |
| **`OpenHands/software-agent-sdk`** | Pairing tokens, outbound relay client, bind flags — only if they belong on agent-server |
| **`OpenHands/typescript-client`** | RN-safe exports if a browser-only bit blocks the spike |
| **Relay** (hosted or self-hosted, later) | Presence + pairing + byte pipe. No conversation store |

Do not add a mobile UI to Agent Canvas. Do not add new Cloud conversation
APIs just to remote-control a laptop.

### 6.1 Where the laptop facade should live

The unified remote-session API belongs on the **laptop OpenHands process**
(Canvas / ingress), because that process already has the backend registry
and the local-vs-cloud service branch.

If the laptop is on Cloud, the hop is Phone → laptop → Cloud. That extra
latency is correct: org, proxy, and secrets stay where they already work.

## 7. MVP build order

1. **Scaffold Expo** in this repo (after these notes). SecureStore-backed
   connection list.
2. **Spike typescript-client in RN** — `ConversationClient` + WebSocket +
   device flow. Stop if the client is not RN-safe and fix the client first.
3. **Direct backend mode** — host + key (covers Tailscale / tunnel laptops
   with no new desktop work) and Cloud device flow.
4. **Chat** — list, create, open, send, REST history then WS
   `resend_mode: since` (same pattern as Canvas). Collapse tool runs.
5. **Canvas pairing spike** — “Allow remote access”, QR, short-lived token,
   LAN + Tailscale. Phone mode: “This laptop.”
6. **Unified facade** on the laptop so Cloud-on-laptop conversations appear
   on the phone without a Cloud login on the phone.
7. **Tablet split view.**
8. **Optional device relay** so LTE works without Tailscale.

Do not start with voice, push, mDNS, or the hosted relay.

## 8. Security

- Pairing tokens are short-lived. Device credentials live in SecureStore.
- Never persist provider keys on the phone for laptop mode.
- TLS to a trusted relay is enough for v1. End-to-end encryption over the
  pipe (VS Code tunnel style) is a later upgrade. The relay must not need
  LLM keys.
- Public tunnels require a strong key and user opt-in. They are not the
  default path.
- Store review: camera (QR) and local-network purpose strings.

## 9. Compatibility

Reuse Canvas’s agent-server version floor so an old laptop install fails
with a clear message instead of a broken chat.

WebSocket resume should use `resend_mode: since` after REST seed, matching
Canvas, so relays and flaky LTE do not require `resend_all`.

`localhost` URLs inside events (VS Code, file links) are wrong on the
phone. Defer those surfaces; do not deep-link them in v1.

## 10. Open questions

Resolve these before building the laptop facade (step 6), not before the
Expo spike.

1. Is the remote-session API a thin HTTP/WS facade in Canvas/ingress, or a
   first-class agent-server feature in the SDK?
2. Who runs the optional device relay in production, and is it a separate
   service from SaaS?
3. Should a paired phone see *all* laptop conversations, or only ones
   started after pairing?
4. Multi-laptop: one phone, several machines — how is the picker labeled?
5. Does “active OpenHands” mean Agent Canvas UI up, or agent-server
   process up (headless / `--public`)?

## 11. Immediate next steps

1. Scaffold the Expo app in this repository.
2. Prove typescript-client + one conversation list against a reachable
   agent-server (LAN or Tailscale).
3. Open a follow-up design in Agent Canvas for pairing + the remote-session
   facade.

The Expo app now implements step 1, a fetch-based slice of step 2
(typescript-client is not RN-safe: it depends on Node `ws` / `http`),
step 3 (host + key only), and step 4 (list / create-best-effort / chat
with REST then WS). Pairing, Cloud device flow, and the laptop facade
are still future work.

Sideload with `npm run android:device` or `npm run ios:device`. See the
README.
