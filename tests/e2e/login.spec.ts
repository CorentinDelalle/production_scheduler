import { expect, test } from '@playwright/test';
import { account } from './account';

test.use({ storageState: { cookies: [], origins: [] } });

test('a wrong password keeps the user on the login page with an error', async ({
    page,
}) => {
    await page.goto('/login');

    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('not-the-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(
        page.getByText('These credentials do not match our records.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
});
