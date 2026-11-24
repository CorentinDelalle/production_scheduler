import { expect, test as setup } from '@playwright/test';
import { account } from './account';

setup('sign in through the login form', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
});
