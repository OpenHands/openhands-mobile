# OpenHands Mobile

Phone and tablet client for [OpenHands](https://github.com/OpenHands/OpenHands). One Expo (React Native) app for iPhone, Android phones, iPad, and Android tablets.

The long-term product is a **second screen for OpenHands that is already running on your laptop**. The laptop keeps its backend (local agent-server, a remote agent-server, or OpenHands Cloud) and whatever LLM is active. The phone does not pick a model or store provider keys.

This repository is an early MVP of the **direct backend** path: you type a reachable agent-server URL and session API key. QR pairing, a laptop remote-session facade, and a hosted relay are not built yet. Architecture notes live in [`docs/PLAN.md`](docs/PLAN.md).

## What works today

- Connect with **host + session API key** (saved in the device keychain / Keystore)
- List conversations on that agent-server
- Open a thread, load recent history over REST, stream live events over WebSocket
- Send messages into an existing conversation
- Best-effort **New chat** (some servers require a full agent payload — start the thread on the laptop if create fails)
- Phone: conversation list → chat. Tablet (wide layout): list | chat

## What this is not

- Not a wrap of Agent Canvas in a WebView
- Not Expo Go (local HTTP and custom native config need a **development build**)
- Not an LLM settings app — do not paste Anthropic / OpenAI keys here
- Not OpenHands Cloud login yet (device flow is planned as a separate mode)
- Not Files, Terminal, Browser, MCP, or skills management

If the laptop’s active backend is OpenHands Cloud, conversations live on Cloud, not on the local agent-server. This MVP talks to the agent-server you give it. Cloud-on-laptop remote control needs the Canvas facade described in the plan.

## Prerequisites

- Node.js 20 or newer
- A running OpenHands / agent-server the phone can reach
- **Android:** Android Studio, a device with USB debugging, or an emulator
- **iOS:** macOS, Xcode, an Apple Developer team, and a registered device

## Install

```bash
git clone https://github.com/OpenHands/openhands-mobile.git
cd openhands-mobile
npm install
```

Typecheck:

```bash
npm run typecheck
```

## Make the laptop reachable

The phone cannot use `http://127.0.0.1` or `http://localhost`. Those addresses are the phone itself.

| Situation | Host to enter on the phone |
|---|---|
| Same Wi-Fi, Canvas on the default ingress | `http://<laptop-lan-ip>:8000` |
| Tailscale (or similar) on both devices | `http://<magicdns-or-tailscale-ip>:8000` |
| Cloudflare Tunnel / ngrok / SSH tunnel | The public `https://…` URL |

Find the laptop LAN IP (macOS): `ipconfig getifaddr en0`.

**Session API key** (default Agent Canvas / `agent-canvas` install):

```text
~/.openhands/agent-canvas/session-api-key.txt
```

That is the OpenHands **session** key (`X-Session-API-Key`), not an LLM provider key.

If the stack only binds loopback (`127.0.0.1`), the phone will time out. Guest Wi-Fi / AP isolation also blocks LAN. Use Tailscale or a tunnel in those cases.

The app allows local-network HTTP (iOS Local Network + `NSAllowsLocalNetworking`, Android cleartext) so `http://192.168.x.x:8000` can work.

## Sideload on a device

Do **not** use Expo Go. Build a development client so LAN HTTP and SecureStore behave like production.

Keep Metro running after a local `expo run:*` debug install. The app loads JS from the bundler until you make an EAS binary.

### Android

1. Enable USB debugging and plug in the phone (or start an emulator).
2. From this repo:

   ```bash
   npm run android:device
   ```

   Equivalent: `npx expo run:android --device`.

3. The first run compiles native code, installs a debug APK, and starts Metro.
4. Open **OpenHands**, enter host + session key, tap **Connect**.

APK via EAS (no USB / no Metro after install):

```bash
npx eas build -p android --profile development
```

`eas.json` also has a `preview` profile that produces an internal APK.

### iOS

1. Open Xcode once if you have never signed for this machine.
2. Plug in a registered device.

   ```bash
   npm run ios:device
   ```

3. On the first build, choose your Development Team for bundle id `dev.openhands.mobile`.
4. Trust the developer certificate on the device if iOS asks.
5. Open **OpenHands** and connect as on Android.

### After install

1. Host: `http://192.168.x.x:8000` (or Tailscale / tunnel URL).
2. Session API key from `session-api-key.txt`.
3. **Connect** — the app checks `/server_info` and refuses agent-servers older than `1.28.0`.
4. Open a conversation. Status **Live** means the event socket is up. **Offline** usually means the laptop slept or the network path died.

**Switch** on the conversation list signs you out of the saved host (the key stays in SecureStore until you overwrite it).

## Simulator and emulator

```bash
npm run ios      # iOS Simulator — can use http://127.0.0.1:8000 on the same Mac
npm run android  # Android emulator — 10.0.2.2 is the host loopback, not 127.0.0.1
npm start        # Metro only; a development build must already be installed
```

A physical phone still needs the laptop’s LAN, Tailscale, or tunnel address.

## Project layout

```text
App.tsx                         Root navigation (phone stack / tablet split)
src/api/agent-server.ts         fetch + WebSocket client for the agent-server
src/storage/connection-store.ts SecureStore for host + session key
src/screens/ConnectScreen.tsx   First-run connection form
src/screens/ConversationListScreen.tsx
src/screens/ChatScreen.tsx      REST history, then WS resend_mode=since
docs/PLAN.md                    Product and architecture agreement
```

`@openhands/typescript-client` is the sanctioned Node/browser client, but it is not React Native–safe today (Node `ws` / `http`). This app mirrors the same routes with `fetch` and the platform WebSocket:

| Action | Request |
|---|---|
| Compatibility | `GET /server_info` |
| List | `GET /api/conversations/search` |
| Create | `POST /api/conversations` |
| History | `GET /api/conversations/:id/events/search` |
| Send | `POST /api/conversations/:id/events?run=true` |
| Live events | `WS /sockets/events/:id` (auth frame `{ type: "auth", session_api_key }`) |

## Related repositories

| Repo | Role |
|---|---|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | Agent Canvas (desktop UI, future pairing + remote-session facade) |
| [OpenHands/software-agent-sdk](https://github.com/OpenHands/software-agent-sdk) | Agent Server |
| [OpenHands/typescript-client](https://github.com/OpenHands/typescript-client) | Typed client (use here once it is RN-safe) |

## Roadmap (short)

1. QR / deep-link pairing to a laptop (`openhands://pair?…`)
2. Unified remote-session API on the laptop so Cloud-on-laptop threads appear without a Cloud login on the phone
3. Optional outbound device relay (LTE without Tailscale)
4. Standalone OpenHands Cloud mode (device flow) as a **separate** entry point

See [`docs/PLAN.md`](docs/PLAN.md) for the full agreement.

## License

MIT. See [`LICENSE`](LICENSE).
