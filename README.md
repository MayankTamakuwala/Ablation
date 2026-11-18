# Ablation

A log for machine learning experiments: what you changed, what it scored, and whether
you could get the number back.

**Live app:** https://ablation-nerf.vercel.app/

**Demo video:** https://youtu.be/8EMzMeVCJ5A

**Slides:** https://docs.google.com/presentation/d/1AuBIiOLX8MCPSZWiGFMb2T9BPoF--pE_uIlEgB1Lvng/edit?usp=sharing

Sign in with `demo` / `ablation2026` to see it populated, or register an account, which
starts empty.

## Authors

Mayank Tamakuwala and Varshith Sai Pothula

Built for [CS 5610 Web Development](https://northeastern.instructure.com/courses/261032),
Khoury College, Northeastern University, Fall 2026.

### Code freeze

**The application code was frozen on November 15, 2026.** These are the last code commits
from each of us, and nothing in the application has changed since:

| Author               | Last code commit                         | Eastern                           | Pacific                          |
| -------------------- | ---------------------------------------- | --------------------------------- | -------------------------------- |
| Mayank Tamakuwala    | `3482adf` link preview image and favicon | November 15, 2026 at 12:00 AM EST | November 14, 2026 at 9:00 PM PST |
| Varshith Sai Pothula | `78823c9` runs collection and run table  | November 14, 2026 at 11:30 PM EST | November 14, 2026 at 8:30 PM PST |

Any commit dated after those two touches `README.md` and nothing else. Those later commits
add the deployed URL, the demo video link, the slides link and the deployment notes below,
all of which only existed once the project was finished and could not have been written
before the freeze. No source file, configuration file or dependency changed.

That is checkable rather than a claim to take on trust. This lists every commit that
touched anything other than the README, most recent first:

```bash
git log --oneline -- . ':(exclude)README.md'
```

The newest entry it returns is `3482adf`, dated November 15, 2026 at 12:00 AM EST.

The times above are for the named commits. Eastern is EST rather than EDT on these dates,
since daylight saving ended on November 1.

## Objective

Training runs are cheap to start and almost impossible to reconstruct. Three weeks after
a result you have a number in a Slack thread, a checkpoint directory called `run_14_final`,
and no record of which of the six things you changed that afternoon actually produced it.
Weights and Biases solves this for teams who set it up in advance. Nobody solves it for the
person who is one week into a project and already lost.

Ablation is built around the field those tools treat as optional: the question. Every
experiment starts with something you are actually trying to find out, written in a sentence,
before any run exists. Runs then hang off that question, each one carrying the
hyperparameters it used and whether anyone managed to reproduce it. A catalog of 1,000
models pulled from the Hugging Face Hub means the base model is a real identifier you
picked from a list, not a string you typed from memory and spelled differently the second
time.

It is also a course project, so under the hood it is a demonstration of Node, Express and
the MongoDB driver behind a React client, with Passport handling sessions. No Mongoose, no
axios, no CORS middleware, no template engines.

## Screenshots

The experiment list, signed in as the demo account. The chips across the top are per status
counts that stay accurate while you search, and the list pages through 1,040 seeded records
twenty at a time.

![The experiment list showing status filter chips, a search box and five experiments](docs/screenshot.png)

Creating an experiment. The base model field searches the seeded catalog and shows each
model's task and download count, so you pick an identifier rather than typing one.

![The new experiment form with the model picker open on a search for bert](docs/screenshot-form.png)

## What it does

Sign in, and you get your own experiments and your own runs. Nobody else's records are
reachable, and a request for a record belonging to another account returns 404 rather than
403, so the API cannot be used to find out which ids exist.

### Experiments

**Define an experiment** with a title, the research question you are trying to answer, the
dataset, a base model from the catalog, a status and optional notes. Only the question and
the base model are the interesting part. Everything else is bookkeeping.

**Work through the list.** Filter to one of four statuses (planned, running, concluded,
abandoned) using the chips, which carry live counts. Search across title, question and
dataset. Both narrow the same query, and the counts respect the search while ignoring the
status filter, because the chips are how you change status in the first place. Results page
twenty at a time.

**Edit in place.** The same form opens pre-filled against an existing record, so correcting
a dataset name does not mean retyping the question.

**Delete with a confirmation.** The dialog is a native `<dialog>` opened with `showModal()`,
which means the focus trap, the backdrop, the inert background and the Escape key are the
browser's behaviour rather than something reimplemented in JavaScript.

### Runs

**Log a run** with its hyperparameters (learning rate, batch size, epochs, seed), what it
scored (accuracy, loss), how long it took, and whether the result was reproduced. Each run
stores its own copy of the experiment label and base model name, captured when the run is
logged.

**Sort and filter the table** by any of the numeric columns, filter to reproduced or not
reproduced, and search. Runs page twenty at a time like experiments do, and the same edit
and delete flow applies.

The two halves are deliberately independent. A run does not join against the experiments
collection and does not call any experiment route. The run table works correctly when no
experiments exist, and the experiment list works correctly when no runs have been logged.

## Running it locally

You need Node 20 or newer and a MongoDB database. A free Atlas M0 cluster works, and so
does Mongo in Docker.

```bash
git clone https://github.com/MayankTamakuwala/Ablation.git
cd Ablation
npm install
cp .env.example .env
```

Open `.env` and set `MONGODB_URI`. For Atlas, go to Network Access and allow `0.0.0.0/0`,
otherwise your own address is blocked. For a local database:

```bash
docker run -d --name ablation-mongo -p 27017:27017 mongo:8
# then set MONGODB_URI=mongodb://127.0.0.1:27017 in .env
```

Populate the database. There are two seed scripts, one per collection. Run both, and run
them in this order: the runs script attaches its records to the demo account, so it exits
with `Demo account not found. Run npm run seed first.` if the first script has not been run
yet.

```bash
npm run seed                                  # models, experiments, demo account
node --env-file=.env scripts/seed-runs.js     # runs
```

The first pulls the 1,000 most downloaded models from the Hugging Face Hub, generates 1,040
synthetic experiments, and creates the demo account to own them. The second generates 1,100
synthetic runs for the same account. Neither needs an API key. Together they take about
thirty seconds, and the first prints the demo credentials when it finishes:

```
demo / ablation2026
```

Both are deterministic. They use a seeded pseudorandom number generator, so the same seed
produces the same database every time.

Then start the two development processes, in two terminals:

```bash
npm run dev                  # Express API on http://localhost:3000
npm --prefix client run dev  # React client on http://localhost:5173
```

Open http://localhost:5173 and sign in.

Two processes is a development-only arrangement. Vite serves the client and proxies `/api`
through to Express so the browser sees a single origin, which is what keeps the session
cookie working. In production there is one origin for real and no proxy, which is why
`client/vite.config.js` sets `changeOrigin: false`.

### Scripts

| Command                                     | What it does                                  |
| ------------------------------------------- | --------------------------------------------- |
| `npm run dev`                               | Express API on port 3000, reads `.env`        |
| `npm --prefix client run dev`               | Vite dev server on port 5173                  |
| `npm run seed`                              | Models, experiments and the demo account      |
| `node --env-file=.env scripts/seed-runs.js` | Runs for the demo account                     |
| `npm run build`                             | Install and build the client to `client/dist` |
| `npm run lint`                              | ESLint across server, scripts and client      |
| `npm run format`                            | Format everything with Prettier               |
| `npm run format:check`                      | Check formatting without writing              |

Seed volumes are configurable through the environment: `SEED_MODELS` (default 1000),
`SEED_EXPERIMENTS` (default 1040) and `SEED_RUNS` (default 1100).

## Deployment

The whole app is one Vercel project. There is no separate backend host.

```
repository root
  ├── buildCommand: npm run build
  │     └── npm --prefix client install && vite build
  │           └── client/dist  ──►  served as static files
  │
  └── api/index.js  ──►  wrapped into a serverless function at /api
```

`vercel.json` supplies all three pieces of configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api" }]
}
```

The rewrite sends every `/api/*` path to the one function, and Express routes it internally
from there. Everything else falls through to the static files. Both come from the same
domain, which is why there is no cross origin request anywhere and the app needs no CORS
middleware at all.

`api/index.js` exports the Express app without ever calling `listen()`. `server/local.js`
is the file that calls `listen()`, and it only runs in development. Nothing starts a
long-lived server in production.

### Project settings that matter

| Setting          | Value                             | Why                                                                                                                            |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Root Directory   | the repository root, not `client` | Pointing it at `client` hides `api/` and `server/` from the build, so the site deploys with no backend and every API call 404s |
| Framework Preset | Other                             | Choosing Vite makes Vercel override `outputDirectory` back to `dist`, and the build then fails to find its own output          |
| Build Command    | leave the override off            | `vercel.json` already supplies it                                                                                              |
| Output Directory | leave the override off            | same                                                                                                                           |

### Environment variables

Set all three in the Vercel project, scoped to Production, Preview and Development:

| Name             | Notes                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | The Atlas connection string. Atlas Network Access must allow `0.0.0.0/0`, because serverless functions have no fixed IP |
| `MONGODB_DB`     | `ablation`                                                                                                              |
| `SESSION_SECRET` | A long random string. Without it the app falls back to a development default that is visible in the source              |

## Troubleshooting

### The seed or the server cannot reach Mongo

Atlas hands you two connection strings, and on some networks only one of them works.

The default looks like `mongodb+srv://...`. The `+srv` part means the driver has to make a
DNS SRV lookup to discover the cluster hosts, and plenty of networks, campus Wi-Fi and VPNs
especially, only forward ordinary A records. When that lookup is refused you get:

```
Error: querySrv ECONNREFUSED _mongodb._tcp.your-cluster.mongodb.net
```

That is your DNS resolver, not the cluster and not your credentials. Two ways out.

**Use the legacy connection string.** In Atlas, go to Connect, then Drivers, then pick an
older Node.js version from the driver version dropdown. You get a string that names the
shard hosts directly, so no SRV lookup happens at all:

```
mongodb://USER:PASSWORD@cluster-shard-00-00.xxxxx.mongodb.net:27017,cluster-shard-00-01.xxxxx.mongodb.net:27017,cluster-shard-00-02.xxxxx.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin
```

Drop that into `MONGODB_URI` and it works on networks where the `+srv` form does not. The
tradeoff is that the hostnames are pinned, so if Atlas ever moves the cluster you have to
fetch a fresh string.

**Or fix DNS on your machine**, by pointing your system resolver at `1.1.1.1` or `8.8.8.8`.
That fixes every `+srv` connection, not just this project.

We deliberately did not put a DNS workaround in the code. Calling `dns.setServers()` inside
the app would override the resolver in every environment, including production, to work
around one machine's network.

### A missing file returns 200 instead of 404

The deployment serves `index.html` for any path that is not a real file and is not under
`/api`, which is the usual single page app fallback. If you are checking whether an asset
deployed, look at the content type rather than the status code. A request for `/og.png`
that comes back as `text/html` means the file is not there, even though it returned 200.

### Sign in works locally but not in production

That is almost always `trust proxy`. The session cookie is set `secure` in production, so
the browser only stores it over https, and Express only considers a request secure if it
trusts the `x-forwarded-proto` header the platform sets. `server/app.js` calls
`app.set("trust proxy", 1)` for exactly this reason. Removing that line produces a
deployment where sign in silently does nothing.

## Project layout

```
api/index.js                Vercel entry, exports the Express app without listening
vercel.json                 Build command, output directory and the /api rewrite
.vercelignore               Keeps docs and wireframes out of the deployment upload
server/
  app.js                    Express setup, sessions, error handling
  local.js                  Development only, the one file that calls listen()
  validate.js               Shared validation, field limits, status whitelist
  validate-runs.js          Run validation and the sortable field whitelist
  auth/password.js          scrypt hashing with a per user salt
  auth/passport.js          Local strategy and the requireAuth guard
  db/client.js              MongoClient cached across serverless invocations
  db/users.js               User lookup and creation
  db/experiments.js         Queries for the experiments collection
  db/runs.js                Queries for the runs collection
  db/models.js              Read only queries for the model catalog
  routes/auth.js            Register, sign in, sign out, session check
  routes/experiments.js     CRUD for experiments
  routes/runs.js            CRUD for runs
  routes/models.js          Catalog search and task list
scripts/
  seed.js                   Hugging Face models, experiments, demo account
  seed-runs.js              Synthetic runs
client/
  index.html                Single page shell, link preview tags
  public/og.png             1200x630 link preview image, served at /og.png
  public/favicon.svg        Site icon
  src/main.jsx              React entry
  src/App.jsx               Session check, then sign in or the app
  src/lib/api.js            Every fetch call in the client lives here
  src/hooks/useRuns.js      Run loading, filtering and sorting state
  src/components/           One component per file, each with its own CSS module
  src/styles/               Design tokens, resets, shared control styles
docs/                       Design document and screenshots
wireframe/                  The wireframes the design document is built on
```

## API

Everything under `/api` returns JSON. Every route except register and sign in requires an
authenticated session, carried in an `httpOnly` cookie.

| Method | Route                  | Purpose                                                         |
| ------ | ---------------------- | --------------------------------------------------------------- |
| GET    | `/api/health`          | Liveness check                                                  |
| GET    | `/api/auth/me`         | The signed in user, or `null`                                   |
| POST   | `/api/auth/register`   | Create an account and sign in                                   |
| POST   | `/api/auth/login`      | Sign in                                                         |
| POST   | `/api/auth/logout`     | Destroy the session                                             |
| GET    | `/api/experiments`     | Your experiments, with `status`, `search`, `limit`, `skip`      |
| POST   | `/api/experiments`     | Create one                                                      |
| GET    | `/api/experiments/:id` | One experiment                                                  |
| PUT    | `/api/experiments/:id` | Update one                                                      |
| DELETE | `/api/experiments/:id` | Delete one                                                      |
| GET    | `/api/runs`            | Your runs, with `sort`, `order`, `reproduced`, `search`, paging |
| POST   | `/api/runs`            | Log a run                                                       |
| GET    | `/api/runs/:id`        | One run                                                         |
| PUT    | `/api/runs/:id`        | Update one                                                      |
| DELETE | `/api/runs/:id`        | Delete one                                                      |
| GET    | `/api/models`          | Catalog search, with `search`, `task`, `limit`                  |
| GET    | `/api/models/tasks`    | Distinct task names and the catalog size                        |

Both list endpoints return `{ items, total, counts, limit, skip }`. `counts` holds the
totals the filter chips display: per status for experiments, reproduced and not reproduced
for runs. `/api/runs` also echoes the `sort` and `order` it applied, so the table can never
show a sort indicator that does not match what the server did.

Runs can be sorted on `createdAt`, `accuracy`, `loss`, `learningRate`, `batchSize`,
`epochs`, `seed` and `durationMinutes`. Any other value is rejected rather than passed
through, so the query string can never name an arbitrary document path.

## A few notes on how it is built

**Sessions live in Mongo, not in memory.** The app is deployed as a serverless function,
and two requests are not guaranteed to reach the same instance, so an in-memory session
store would sign people out at random. `connect-mongo` puts them in a `sessions`
collection instead. The Mongo client itself is cached on `globalThis` for the same reason,
so a thawed function reuses its connection pool rather than opening a new one per request.

**Passwords use `crypto.scrypt`** from the Node standard library rather than bcrypt. It
needs no native build step, which matters on a platform that installs dependencies fresh on
every deploy, and comparison goes through `timingSafeEqual`.

**Sign in gives the same error** for an unknown username and a wrong password. Different
messages would turn the form into a way to find out which accounts exist.

**Pagination sorts by a timestamp and then `_id`.** Without the tiebreak, records sharing a
timestamp can shift between pages as you move through them, and the same row shows up twice.
The seed produces many identical timestamps, so this is not theoretical.

**The two halves validate the base model differently.** `POST /api/runs` rejects a model
identifier that is not in the catalog. `POST /api/experiments` does not: it checks the
length and accepts the string, and the model picker in the form is what steers you to a
real identifier. The stricter rule is the better one, and matching them up is a small
change rather than a redesign.

**The client has no router.** The header switches between the two sections with state, and
the app is a single page in the literal sense. That is also why a deep link cannot break:
there are no deep links.

## Accessibility

Every colour in `client/src/styles/tokens.css` was measured before any component was
written, and the ratio is recorded next to it in the file.

- Body text is `#14181f` on `#fbfaf8`, which is 17.06:1. Muted text is 5.75:1. Both clear
  the WCAG AA threshold of 4.5:1 for normal text.
- Control boundaries use a separate token. The decorative hairline `#e3e0d8` is 1.26:1,
  which would have failed the 3:1 non-text contrast rule if it had been used on inputs, so
  `--line-control` at 3.53:1 exists for every control border.
- The four status colours were chosen to clear 4.5:1 on white individually, so the status
  is never carried by hue alone and is also spelled out in text.
- Focus rings are `2px solid` the accent colour with a `2px` offset. The offset is what
  keeps the ring visible against a filled accent button.
- The delete confirmation is a native `<dialog>` with `showModal()`, so focus trapping, the
  backdrop, background inertness and Escape are browser behaviour rather than
  reimplementations.
- Every control is a real `<button>`, `<input>`, `<select>` or `<form>`. There are no
  clickable `div` elements anywhere in the client.
- Animation is guarded by `prefers-reduced-motion`.

## Who built what

The professor asked that each student write the full stack for their own stories rather
than splitting the work into a frontend half and a backend half. We did it that way.

|                      | Collection    | Server                                                                                            | Client                                                                                                                                       |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Mayank Tamakuwala    | `experiments` | `db/experiments.js`, `routes/experiments.js`, `validate.js`, auth and sessions, `scripts/seed.js` | `ExperimentList`, `ExperimentRow`, `ExperimentForm`, `ModelPicker`, `StatusFilter`, `Pagination`, `ConfirmDialog`, `SignInForm`, `AppHeader` |
| Varshith Sai Pothula | `runs`        | `db/runs.js`, `routes/runs.js`, `validate-runs.js`, `scripts/seed-runs.js`                        | `RunsPage`, `RunTable`, `RunRow`, `RunForm`, `ReproducedFilter`, `ConfirmDeleteDialog`, `useRuns`                                            |

The model catalog is shared reference data that both halves read and neither writes.

## Known limitations

- **Re-running `npm run seed` can leave the catalog above 1,000 models.** Models are
  upserted by id, so an entry that has since dropped out of the Hugging Face top 1,000 stays
  behind rather than being removed. A fresh database always lands on exactly 1,000.
- **There is one shared demo account.** That is deliberate for a project a grader will open
  without registering, but it means anyone signed in as `demo` can edit the same records.
- **No password reset and no email.** Accounts are username and password only.
- **The two seed scripts are separate.** `npm run seed` does not populate runs. The runs
  script has to be run on its own, as documented above.

## Design document

The design document, with personas, user stories, wireframes and the accessibility
decisions behind the palette, is at
[docs/DESIGN-DOCUMENT.pdf](docs/DESIGN-DOCUMENT.pdf).

## License

MIT. See [LICENSE](LICENSE).

## Data

The model catalog comes from the [Hugging Face Hub](https://huggingface.co) public API,
which is free and needs no key. Experiment and run records are synthetic, generated by a
seeded pseudorandom number generator so the same seed produces the same database.
