# Production Scheduler

A Laravel application that plans print production for Hart Print: orders go in, a production schedule comes out. It prioritises need-by dates and factors in production speed per product type and changeover time between types.

Built for the Hart Print technical test "Laravel Production Schedule Optimization".

## Live demo

**https://web-production-235f6504.up.railway.app**

- Email: `reviewer@example.com`
- Password: sent separately.

The demo data is relative to the day it was seeded: orders are due 6 to 20 days out, and one of them is planned late on purpose.

## What it does

- **Plan** (home page after sign-in): a timeline with one row per machine, the late orders, and a start date to plan from. On mobile, an agenda per machine.
- **Orders**: create, edit and delete orders. An order has a customer, a need-by date and one or more products of the same type, with quantities. Each order shows its machine, planned end and on-time or late status.
- **Catalog**: customers, product types (speed and changeover time), products and machines.
- **Input validation** on every form, with clear messages.

### How the schedule is computed

A greedy algorithm in a pure service class, [`app/Services/Scheduler.php`](app/Services/Scheduler.php):

1. Orders are taken by need-by date. On equal dates, the order that would finish earliest goes first.
2. Each order goes to the machine where it would finish earliest, so a machine already set up for the type is preferred.
3. A changeover is paid on a type change, and on the first order of each machine.
4. An order is late if it ends after the end of its need-by day (Montreal time).

The schedule is computed on every view, not stored. The reasons, the assumptions and the alternatives left out are in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Run it locally

Requirements: PHP 8.4, Composer, Node.js 22.18+ or 24.11+. The database is a SQLite file, so there is nothing else to install.

```bash
git clone <repository-url> production-scheduler
cd production-scheduler
composer setup
```

`composer setup` installs the dependencies, creates `.env`, generates the app key, creates the SQLite database, runs the migrations and builds the frontend. It does not seed: the seeded account needs credentials first.

1. In `.env`, set the account you will sign in with:

    ```dotenv
    SEEDED_USER_EMAIL=you@example.com
    SEEDED_USER_PASSWORD=choose-a-password
    ```

2. Seed the account and the reference data from the brief (types 1 to 3, products A to F, two machines), then the demo orders:

    ```bash
    php artisan db:seed
    php artisan db:seed --class=DemoSeeder
    ```

3. Start the app, then open http://localhost:8000 and sign in:

    ```bash
    composer run dev
    ```

`db:seed` is safe to run again: it updates the account from `.env` and only adds the reference data that is missing, so values edited in the app are kept. `DemoSeeder` skips if orders already exist.

## Tests and checks

| Command               | What it runs                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `composer test`       | Pint (style), PHPStan, then the PHPUnit suite (in-memory SQLite) |
| `npm run check`       | Frontend lint and format check                                   |
| `npm run types:check` | TypeScript type check                                            |
| `npm run test:e2e`    | Playwright end-to-end tests (local only)                         |

- **PHPUnit** (`tests/`): the scheduler has unit tests for targeted cases (rounding, changeovers, ties, daylight saving time, late orders), plus seeded generated plans checked against invariants computed independently of the scheduler. Feature tests cover every controller, the validation rules and the deletion rules.
- **Playwright** (`tests/e2e/`): sign-in, the order form and its errors, and the plan (machine rows, late badge, Montreal times, escaped customer names). Run `npx playwright install chromium` once. The tests build the frontend, then use their own database (`database/e2e.sqlite`) and port (8001), so they do not touch your local data.

CI (GitHub Actions) runs the checks and the PHPUnit suite on every push to `main` and every pull request. Production deploys from `main` once CI passes.

## Stack

Laravel 13, Inertia v3 with React and TypeScript, Tailwind CSS v4 and shadcn/ui (from the Laravel React starter kit), and [vis-timeline](https://visjs.github.io/vis-timeline/) for the timeline. SQLite locally and in tests, PostgreSQL in production, hosted on Railway.

## Documentation

[`docs/DECISIONS.md`](docs/DECISIONS.md), in one place:

1. Scope: the user stories, prioritised, with their status.
2. Data model: the database schema and why it looks this way.
3. Scheduling: the algorithm and the alternatives left out.
4. Assumptions where the brief is silent.
5. Stack, auth and deployment.
6. Testing.
7. Possible improvements.

## AI usage

### What I did myself

- **Analysis**: identified the application's needs and goals and turned them into prioritised user stories.
- **Domain knowledge**: identified the specifics of print production from my past experience and training.
- **Design**: UX/UI requirements and the test cases to cover.
- **Database**: designed the schema myself in dbdiagram.io (diagram in `docs/DECISIONS.md`).
- **Stack choices**: starter kit, libraries and deployment.

### What AI did

Implementation was done with Claude Code, following instructions and context I defined (see `CLAUDE.md`). Laravel Boost (in `composer.json`) generates the framework guidelines in `CLAUDE.md` and gives the agent an MCP server on the app, which made that context easier to set up.

### How I verified it

- Automated tests on the scheduler and the main flows.
- Manual review of the critical code, the scheduling algorithm first.
- End-to-end tests with Playwright (`tests/e2e`), plus manual browser checks of the deployed app.
- I kept the final say on the scope. For example, I dropped a more sophisticated scheduling algorithm because it opened several edge cases and would have delayed delivery. It is documented as a possible evolution in `docs/DECISIONS.md`.

### Conclusion

AI made me faster, but the decisions, the trade-offs and the final validation are mine.
