# The "Get in touch" relay

The about screen's message box POSTs `{ name, contact, message }` here, and
this forwards it to the study team. It is a Cloudflare Worker, adapted from
the owner's portfolio relay, which is the shape the web app was already
written against.

## Why it is not a route on the API

Every `/v1` route sits behind the platform's auth middleware, and this has
to answer somebody who cannot sign in — that is the case it exists for.
Carving an unauthenticated `POST` out of the middleware that protects
participants' records, on the service that holds them, is a larger thing
than a contact form should be. Out here, the worst a flood can do is fill
an inbox.

The cost is real and is recorded as **B-25**: a participant's words leave
the platform's audit trail and permission engine for a service this
codebase does not control.

## Deploying it

Needs a free Cloudflare account. From this directory:

```bash
npx wrangler login              # browser authorisation, once
npx wrangler secret put BOT_TOKEN   # paste the Telegram bot token
npx wrangler secret put CHAT_ID     # paste the destination chat id
npx wrangler deploy
```

To get those two values: message **@BotFather** on Telegram, `/newbot`, and
keep the token it gives you. Then send your new bot any message and open
`https://api.telegram.org/bot<TOKEN>/getUpdates` — the `chat.id` in the
reply is `CHAT_ID`.

Check `ALLOWED_ORIGIN` in `wrangler.toml` names the site that will post to
it. It is required: deployed without it the relay refuses everything,
because an unset origin list would otherwise let any site on the web post
into the study team's inbox in this project's name.

## Connecting the site to it

`wrangler deploy` prints the Worker's URL. Set it as the repository
**Variable** `CONTACT_ENDPOINT` (Settings → Secrets and variables →
Actions → Variables). It is a Variable and not a Secret because the browser
calls it, so it is in the bundle either way and nothing about it is
private.

Until it is set, the deploy logs a warning and the about screen says
plainly that there is no way to send a message — rather than showing a box
that accepts what somebody writes and drops it.

## What this deliberately does differently from the portfolio version

- **An unset `ALLOWED_ORIGIN` refuses.** The original echoes the caller's
  own origin, which makes the relay usable from any page on the web.
- **Over-length is refused, not trimmed.** The original slices to the limit
  and forwards what survived, so a long message arrives with the end
  missing and nobody is told. The browser already refuses at the same
  numbers, so a message either arrives whole or does not arrive.
- **An optional per-address rate limit**, which the original has none of.

## What crosses this boundary

The screen invites somebody to write freely, so a message may carry health
information, distress, or another person's name. Nothing here logs the
body, and nothing that does should be added.

Still open, and not solved by any code here: **B-24**, nobody is yet named
to read these or answer them, and there is no rule for a message that
arrives at four in the morning saying somebody is in trouble. **B-26**, the
crisis route the telephone number used to be is still absent.
