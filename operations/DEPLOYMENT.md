# DEPLOYMENT

> **This repository is public.** Every value that points at the real
> deployment — domain names, endpoints, project identifiers — lives in
> repository Variables (Settings → Secrets and variables → Actions →
> Variables), and appears in this document only as an angle-bracket
> placeholder. Think before you paste a real value in here: **anyone can
> read it.** Values that must stay secret (database connection strings,
> session secrets, access tokens) belong in Secret Manager or Actions
> Secrets, not in Variables — Variables are visible to collaborators, and
> once one is printed into a log it is public.

> Cloud Run + Neon deployment and CI/CD notes. This follows the pattern already proven by aging-knowledge-graph in the same GCP project (keyless WIF authentication, Secret Manager, `gcloud run deploy --source .`). **This deployment environment carries a conceptual research prototype holding synthetic data only** (ADR-061/062). There are two authentication modes (ADR-104): `AUTH_MODE=google` is real authentication (see "Switching on Sign in with Google" below), and `AUTH_MODE=dev-header` is the development / synthetic-pilot stub, where identity is whatever `x-actor-id` claims it to be. **The current deployment runs on the stub**, and the access-token gate is a compensating boundary, not authentication.

## Architecture

- **A single Cloud Run service** (`hadi-platform` by default): one container in which `tools/start-cloud.mjs` starts three processes — the API (which also serves the `apps/web/dist` web application from the same origin) + the pg-boss worker + the scheduler (`RUN_JOBS=true`, with the scheduler staggered by 5 seconds to avoid a pg-boss initialisation deadlock). If any one process exits the whole container exits (fail closed: better to restart than to keep running a service whose safety sweeps have silently died).
- **Neon PostgreSQL**: `DATABASE_URL` is injected from the `HADI_DATABASE_URL` secret in Secret Manager. Migrations run inside the deploy workflow, from the GitHub runner directly against Neon, **before** the new revision goes live (every migration is reversible and CI rehearses them on every push).
- **Real Knowledge Graph integration**: when the `KNOWLEDGE_MCP_URL` repository variable is set, the deployment switches to `KNOWLEDGE_PLATFORM_MODE=mcp` and points at that endpoint; when the variable is absent it stays on the deterministic simulator.
- **Access boundary (fail closed)**: if the `HADI_ACCESS_TOKEN` secret exists → the service is open to the internet but every `/v1` request must carry `X-Access-Token` (compared in constant time; static assets and /health stay open and carry no data). If the secret does not exist → the service is deployed with IAM-only ingress and is not reachable from the internet. On the web side, opening `<url>/?token=<token>` once stores the token and strips it from the address bar.

## The CI/CD chain

On every push to main: `CI` (build / lint / boundaries / traceability / migration rehearsal / full test suite / backup rehearsal) → on success this automatically triggers `Deploy to Cloud Run`, which deploys the exact commit CI verified (`workflow_run.head_sha`). When the repository variables are not configured the deploy workflow prints a notice and skips, rather than going red. To deploy by hand: Actions → Deploy to Cloud Run → Run workflow.

## One-time setup (three steps)

1. **Neon**: create a database in the Neon console (or a new branch / new project) and take the `postgresql://…?sslmode=require` connection string. There are no tables to create by hand — the deploy workflow runs the migrations.
2. **GCP** (Cloud Shell, as project Owner):
   ```bash
   PROJECT_ID=<gcp-project> \
   DATABASE_URL='postgresql://…?sslmode=require' \
   ACCESS_TOKEN="$(openssl rand -hex 24)" \
     bash scripts/setup-gcp.sh
   ```
   The script is safe to re-run: it enables the APIs, reuses or creates the `github-pool` WIF pool and creates a `github-hadi` provider for **this repository** (the WIF condition is pinned to the repository, so the KG repository's provider cannot be shared), reuses the `deployer` SA and grants this repository impersonation rights, and writes the `HADI_DATABASE_URL` / `HADI_ACCESS_TOKEN` secrets.
3. **GitHub repository variables** (Settings → Secrets and variables → Actions → Variables; the script prints them verbatim at the end): `GCP_PROJECT_ID`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `GCP_REGION`.

Any push after that completes a deployment; visit `https://<service-url>/?token=<ACCESS_TOKEN>`.

Optional variables: `CLOUD_RUN_SERVICE` (defaults to hadi-platform), `MIN_INSTANCES` (defaults to 0, see below), `RUN_JOBS` (defaults to true), `KNOWLEDGE_MCP_URL`.

## Honest limitations

1. **Background jobs and scaling to zero**: with `MIN_INSTANCES=0` there is no instance when there are no requests, so the pg-boss sweeps (match expiry, delivery reconciliation, object scanning and so on) only run while an instance exists. That is acceptable for a research prototype; for continuous scheduling set `MIN_INSTANCES=1` (which costs money continuously).
2. **Identity is still a development stub**: the access token is a shared-secret boundary. It does not distinguish between people and cannot be revoked for one person. Real users are conditional on OIDC (ADR-104) plus production-readiness approval (see PILOT_READINESS_REPORT).
3. **The data must stay synthetic**: no real personal data may be entered into this environment (Doc 19 §2, conceptual mode; the ADR-063 exemption does not extend to empirical data).
4. **Object storage is connected to Cloudflare R2 (ADR-106)** — all four settings are present, and since 2026-08-08 the running revision reports `fileStorage: object-store` at `/ready`, with bytes no longer written into the `simulated_blobs` column in Postgres. **A half-configuration does not fall back; it refuses to start.** **But "configured and connected" is not the same as "exercised"**: to this day not one byte has entered that bucket from a real browser session — the upload → scan → attach chain has never been walked end to end in the deployment environment. **Upload scanning is still a simulator** (it recognises only the EICAR test string, ADR-126), so the interface must never say anything has been checked for viruses. The communication provider is a deterministic simulator.

## Splitting the participant entrance and the staff entrance across two addresses

Set the **`STAFF_HOSTS`** repository variable (a comma-separated list of hostnames, e.g. `admin.example.org`) and point both domains at the same Cloud Run service. The deployment writes it into `apps/web/.env.production`, where the frontend build reads it. If it is not set there is one address with every entrance on the sign-in page (this is also the local development and test setup).

**This is not access control, and it must never be described that way anywhere.** Both domains are served by the **same deployment**, share the **same access token**, and identity is still the development stub — `x-actor-id` is whoever it says it is (ADR-104). **Anyone who can reach one address can reach the other, and can claim any identity on either side.** What the split does give you is: the participant entrance shows only the one door that belongs to a participant, and the browser stores the tokens separately per domain. The only thing actually protecting staff work is still the permission engine.

To make the addresses a real boundary you would need two Cloud Run services holding separate tokens (or simply put the staff side on IAM-only ingress); that is a different piece of work and was not done here.

## The smoke test verified locally (worth re-running after any change to the deployment chain)

```bash
pnpm build
DATABASE_URL=postgres://platform:platform_dev_only@localhost:5432/research_platform \
PORT=8099 WEB_DIST_DIR=$PWD/apps/web/dist ACCESS_TOKEN=local-smoke-token-0123456789 \
  node tools/start-cloud.mjs
# Expect: /health 200; / returns the SPA; /v1 without a token gives a 401 in the standard error envelope; with a token it goes through the normal permission engine
```

## Switching on Sign in with Google (ADR-104)

This is the precondition for real users. Once this section is done, `x-actor-id` is never read again, and identity comes from a server-issued, revocable session cookie.

### 1. Create an OAuth client in the Google Cloud console

**APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.

**Authorised JavaScript origins** (one per public hostname):

```
<participant-entrance-domain>
<staff-entrance-domain>
```

**Authorised redirect URIs — this field is mandatory, and it is the root path with a trailing slash**:

```
<participant-entrance-domain>/
<staff-entrance-domain>/
```

**If you fill in only the JavaScript origins and leave the redirect URIs empty, sign-in will fail every time** with `redirect_uri_mismatch`. And that error appears only on Google's own page — this platform's logs stay perfectly clean and show nothing at all, because the browser never came back. The participant entrance and the staff entrance are two domains of the same service (D-66), so **both must be registered**; missing one locks that whole side out.

This implementation uses the OIDC redirect flow (`response_type=id_token`), and the return address is `window.location.origin + '/'`, which is why what you register must be the root path.

**This platform makes no use whatsoever of the client secret**; `response_type=id_token` does not need one. Do not put it in Secret Manager and do not put it in the repository — the simplest thing is to delete or rotate it as soon as the client is created, leaving one fewer thing to keep safe.

### 2. Publish the consent screen (otherwise only the test users you list can sign in)

**Google Auth Platform → Audience**: if the publishing status is **Testing**, then **only the test users you have explicitly listed can sign in** and everyone else is turned away by Google — in that state self-registration effectively does not exist.

This platform requests only the three **non-sensitive** scopes `openid email profile`, so:

- The line you see when creating the client, "OAuth is limited to 100 **sensitive scope** logins until verified", **does not apply to this platform** — we request no sensitive scopes at all.
- Publishing to **In production** therefore **does not** require going through Google's verification review.

To open self-registration, publish it; to run a closed test first, leave it on Testing and add participants to the test-user list one at a time.

### 3. Configure the service

The deploy workflow recognises this the same way it recognises the access-token gate and R2 — "switch over once it is fully configured", with **no flag day**: when both the `GOOGLE_CLIENT_ID` repository variable and the `HADI_SESSION_SECRET` secret are present, the next deployment switches automatically to `AUTH_MODE=google`. If either is missing it stays on the dev-header stub and the deployment summary says which one is missing.

```
# Repository variables (Settings → Secrets and variables → Actions → Variables)
GOOGLE_CLIENT_ID    = <the client ID created in the previous step>.apps.googleusercontent.com
# Optional: GOOGLE_ALLOWED_DOMAINS / GOOGLE_MFA_DOMAINS / ALLOW_SELF_SIGNUP

# Secret Manager
HADI_SESSION_SECRET = <random string of 32 characters or more>
```

| Variable | Required | Notes |
|---|---|---|
| `AUTH_MODE` | Yes | Set to `google`. Setting the retired value `oidc` refuses to start and tells you the new name |
| `GOOGLE_CLIENT_ID` | Yes | The client ID from the previous step; the ID token's `aud` is checked against it |
| `SESSION_SECRET` | Yes | A random string of 32 characters or more, kept in Secret Manager. Used to sign the sign-in nonce |
| `GOOGLE_ALLOWED_DOMAINS` | No | Comma-separated; restricts sign-in to these Workspace domains. **Judged on the `hd` claim, not on the characters after the `@` in the email address** |
| `GOOGLE_MFA_DOMAINS` | No | Comma-separated. **This is an assertion by the operator**: that this Workspace domain has two-step verification enforced. See "About strong authentication" below |
| `ALLOW_SELF_SIGNUP` | No | Defaults to `true` (owner's ruling). Set `false` to reject Google accounts that have not been invited |
| `BOOTSTRAP_ADMIN_EMAIL` | No | The Google email address of the first administrator. **Takes effect only while the platform has no administrator at all**, and stops working once it has been used |
| `SESSION_TTL_MINUTES` | No | Defaults to 720 (12 hours) |
| `STEP_UP_TTL_MINUTES` | No | Defaults to 10. How long one re-authentication counts for |
| `STEP_UP_MAX_AGE_SECONDS` | No | Defaults to 120. How recently Google must have authenticated the person |
| `COOKIE_SECURE` | No | Defaults to `true`. **Only http://localhost should ever set this to false** — a Secure cookie is simply not stored by the browser over plain HTTP, and what that looks like is "I pressed sign in and nothing happened" |

With `GOOGLE_CLIENT_ID` or `SESSION_SECRET` missing the process **refuses to start**: a platform that comes up but can authenticate nobody looks exactly like a broken one.

### 4. The first administrator

Set one repository variable:

```
BOOTSTRAP_ADMIN_EMAIL = you@example.org
```

Sign in once with that Google account and it is granted `SystemAdministrator`. **It takes effect only while the platform has no administrator at all** — once anyone holds that role the variable does nothing, including for the person named in it. That is what makes it a bootstrap rather than a back door. The address must be one Google has verified; otherwise anyone who knows it could register a Google account claiming that address and become a platform administrator.

Everything after that happens in the interface: go to the staff workspace → choose an organisation (you can create one if there is none) → "Accounts and roles".

### 5. Self-registration and invitations (all in the interface)

**Any Google account can register itself** (`ALLOW_SELF_SIGNUP`, defaults to `true`; a deployment with a fixed cohort can set `false` for invitation-only).

What a self-registered person gets is: an account, a participant record of their own, **and a view in which they can see nothing**. That is not the sign-in code being polite, it is structural — step 2 of the permission engine refuses any actor with no role outright with `no-granting-role`, leaving only the "I am the owner of this resource" path. Open Matching requires **both** sides to have switched it on, and the community requires the `community-participation` consent; a new account has neither.

**Invitations are the only path that grants anything**, and all three are in the interface:

| What you want to do | Where |
|---|---|
| Invite a colleague to join | Staff → "Accounts and roles" → invite someone |
| Give an account that **exists but that nobody can sign in to** (created before a migration, or by the seed) a holder again | Same screen, "Invite its holder" on that account's card |
| Give someone a role | Same screen, the role dropdown on the account card |
| A participant inviting their own supporter (a daughter reading a life story) | Participant → "Who can see me" → "Invite someone to see my things" |
| Create an organisation | The organisation-chooser screen (needs a platform administrator) |

**The platform does not send email.** It has no ability to send email, and all three places in the interface say so on the first line — an invitation is only recorded, its address and expiry are shown back to you, and passing it on to the other person is your job. A button labelled "invite" that sends nothing is worse than a button that says plainly it only writes a record.

**Invitations work just as well for people who have already registered**: every sign-in checks for unclaimed invitations.

`user_accounts.origin` records how each account came about (`self-registered` / `invitation` / `created-by-administrator`).

### 6. About strong authentication (10 actions depend on it)

Approving an intervention version, deciding an export, locking a dataset, creating a safety event and six other actions require the `mfa` tier. **Google's ID token contains no `amr`**, so "this person used a second factor" is not something that can be read out of the token.

What the platform does instead:

- An ordinary Google sign-in is always recorded as `password`.
- When strong authentication is needed, "Confirm it is you" appears in the interface and runs one `prompt=login` re-authentication, which yields `step-up`. In the permission engine step-up(3) is **higher** than mfa(2), so all ten of these actions are reachable. It answers the harder question: not "did this person use a second factor at some point today" but "is this person still at the keyboard right now".
- `GOOGLE_MFA_DOMAINS` is the only path that records `mfa`, and what it trusts is **your assertion**, not proof from Google. Confirm that the domain really does enforce two-step verification before filling it in; leaving it empty works perfectly well, it just means these actions ask you to "Confirm it is you" each time.

### 7. To open self-registration, the access-token gate has to go first

`ACCESS_TOKEN` blocks **all** of `/v1`, including `/v1/auth/nonce` and `/v1/auth/session`. Which means **while it is in place, someone without the password cannot even begin to sign in** — self-registration does not exist in fact, and "registration" becomes "registration for people who already have the shared password".

This is not a defect: the reason that gate exists in the first place is set out plainly in the code comments — it is a compensating boundary for the period when **identity is still a stub**. Once real identity is on, its job is done.

- **To open registration**: delete the `HADI_ACCESS_TOKEN` secret, **and then deploy again** (Actions → Deploy to Cloud Run → Run workflow). Deleting the secret does not itself trigger a deployment, and the running revision is still bound to that secret — without a redeployment the next cold start fails because it references a secret that no longer exists.
- **To run a closed test first**: keep it, in which case "self-registration" is in practice "registration by holders of the password". That is a reasonable transitional state too — as long as you know which one you are in.

### 8. Rolling back

Set `AUTH_MODE` back to `dev-header`; the data is unaffected. Google links that have been established, invitations and sessions all stay in the database, and switching back to `google` makes them effective again. Do not expose the stub mode publicly.


## Demo accounts (synthetic data)

The deployment's database starts empty — the dev-header sign-in stub requires the actor/participant to genuinely exist in the database. Run the seed once:

**GitHub → Actions → "Seed demo data" → Run workflow** (idempotent: re-running only prints the accounts that already exist, it does not create duplicates). The account identifiers are printed in the run summary.

What the seed contains (all synthetic, ADR-062): one organisation; nine role accounts (organisation administrator / researcher / approver / evidence reviewer / safety reviewer / privacy reviewer / community moderator / coordinator / supporter); two participants (Ann and Ben, granted the study-participation, open-matching, participant-messaging, community-participation, supporter-involvement and supporter-contribution consents); a "Gardening Corner" community with versioned rules and one published post from each of them; a match → mutual acceptance → connection → one confirmed, sent message; one life-story entry drafted by AI and confirmed by the person themselves as Testimony (visibility Selected People); and one supporter relationship approved by the participant.

How to sign in (**only under `AUTH_MODE=dev-header`**; once Sign in with Google is on these fields no longer appear, the interface becomes "Sign in with Google", and the participant identifier is looked up server-side rather than typed by anyone): on the home page, "Participant" takes an actor id + participant id; "Staff entrance" takes only an actor id (the approval-type MFA actions are exercised by ticking strong authentication on the staff page); "Supporter entrance" takes the supporter's actor id.

The access password: opening `<url>/?token=<token>` for the first time stores it in this browser and strips it from the address bar (so the address in your history does not contain the token). If you have cleared site data or moved to another device, any request returns 401 and a banner appears at the top of the interface saying an access password is needed for this environment; you can type it straight in there, without having to hunt for the link with the token in it.

The same works locally: `DATABASE_URL=… pnpm seed:demo`.

## If a deploy fails with "Another migration is already running"

It means two deploys overlapped. `node-pg-migrate` takes a lock so that exactly one migration touches the database at a time, and that error is the lock doing its job — what was wrong is that two deploys were asking.

It happened on 2026-08-16: two pushes a couple of minutes apart produced two CI runs, each of which fired its own deploy, and the two overlapped. The workflow now has a `concurrency` group so a second deploy queues behind the first instead of racing it, and `packages/database/test/deploy-smoke.test.ts` asserts the group is there.

**Do not "fix" this by clearing the lock or adding `--no-lock`.** The lock is what stops two migrations applying to one database at once, and a half-applied migration is a far worse problem than a deploy that waits. If the error appears again with no overlapping run in the Actions list, the lock row in `migration_admin` has been left behind by a killed process — that is worth investigating rather than clearing, because something killed a migration mid-flight.

**The reason this mattered was never mainly the red build.** Two `gcloud run deploy` calls carrying different commits race, and whichever finishes last is the revision serving traffic — so the deployed code can quietly be older than `main`, with nothing red anywhere to say so. The failed migration was the visible half of the defect; that is the silent half.
