import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { account } from './tests/e2e/account';

const port = 8001;

/**
 * End-to-end tests, run locally with `npm run test:e2e`.
 *
 * The app runs on its own port and SQLite file, rebuilt from EndToEndSeeder before each run.
 * Variables set here win over `.env` (Laravel never overrides an existing variable), and
 * `--no-reload` passes them on to the server process.
 */
export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    reporter: 'list',
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'chromium',
            dependencies: ['setup'],
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'tests/e2e/.auth/user.json',
                // Not Montreal: the plan must show Montreal times whatever the browser's timezone.
                timezoneId: 'Europe/Paris',
            },
        },
    ],
    webServer: {
        command: [
            'touch database/e2e.sqlite',
            'php artisan migrate:fresh --seed --seeder=EndToEndSeeder --force',
            `php artisan serve --no-reload --host=127.0.0.1 --port=${port}`,
        ].join(' && '),
        url: `http://127.0.0.1:${port}/login`,
        reuseExistingServer: false,
        env: {
            APP_URL: `http://127.0.0.1:${port}`,
            DB_CONNECTION: 'sqlite',
            DB_DATABASE: path.resolve('database/e2e.sqlite'),
            SEEDED_USER_NAME: account.name,
            SEEDED_USER_EMAIL: account.email,
            SEEDED_USER_PASSWORD: account.password,
        },
    },
});
