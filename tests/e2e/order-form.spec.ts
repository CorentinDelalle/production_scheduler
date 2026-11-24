import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openNewOrder(page: Page) {
    await page.goto('/dashboard?start=2030-01-07');
    await page.getByRole('button', { name: 'New order' }).click();
}

async function pickOption(page: Page, field: string, option: string) {
    await page.getByRole('combobox', { name: field }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
}

test('an empty order shows an error next to each field', async ({ page }) => {
    await openNewOrder(page);

    await page.getByRole('button', { name: 'Add order' }).click();

    await expect(
        page.getByText('Fix the highlighted fields to save the order.'),
    ).toBeVisible();
    await expect(page.locator('#order-customer-error')).toHaveText(
        'The customer field is required.',
    );
    await expect(page.locator('#order-type-error')).toHaveText(
        'The product type field is required.',
    );
    await expect(page.locator('#order-line-0-error')).toHaveText(
        'The product field is required.',
    );
    await expect(page.locator('#order-need-by-error')).toHaveText(
        'The need-by date field is required.',
    );
});

test('a server error shows on the product line it belongs to', async ({
    page,
}) => {
    await openNewOrder(page);
    await pickOption(page, 'Customer', 'Harbor Cafe');
    await page.getByRole('radio', { name: /Type 1/ }).click();
    await pickOption(page, 'Product, line 1', 'A');
    await page.getByLabel('Quantity, line 1').fill('100');
    await page.getByRole('button', { name: 'Add product line' }).click();
    await pickOption(page, 'Product, line 2', 'B');
    await page.getByLabel('Quantity, line 2').fill('0');
    await page.getByLabel('Need-by date').fill('2030-02-28');

    await page.getByRole('button', { name: 'Add order' }).click();

    await expect(page.locator('#order-line-1-error')).toHaveText(
        'The quantity field must be at least 1.',
    );
    await expect(page.locator('#order-line-0-error')).toHaveCount(0);
    await expect(page.getByLabel('Quantity, line 1')).toHaveValue('100');
});

test('switching the type removes the products of the previous type', async ({
    page,
}) => {
    await openNewOrder(page);
    await page.getByRole('radio', { name: /Type 1/ }).click();
    await pickOption(page, 'Product, line 1', 'A');

    await page.getByRole('radio', { name: /Type 3/ }).click();

    await expect(
        page.getByText('Products of another type were removed.'),
    ).toBeVisible();
    await expect(
        page.getByRole('combobox', { name: 'Product, line 1' }),
    ).toHaveText('Select a product');
    await page.getByRole('combobox', { name: 'Product, line 1' }).click();
    await expect(page.getByRole('option')).toHaveText(['D', 'E']);
});

test('a new order appears on the plan and in the orders list', async ({
    page,
}) => {
    await openNewOrder(page);
    await pickOption(page, 'Customer', 'Harbor Cafe');
    await page.getByRole('radio', { name: /Type 2/ }).click();
    await pickOption(page, 'Product, line 1', 'C');
    await page.getByLabel('Quantity, line 1').fill('770');
    await page.getByLabel('Need-by date').fill('2030-02-28');

    await page.getByRole('button', { name: 'Add order' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/Order #\d+ added\./)).toBeVisible();
    await expect(
        page
            .locator('.vis-item.tl-production')
            .filter({ hasText: 'Harbor Cafe' }),
    ).toBeVisible();

    await page.goto('/orders?start=2030-01-07');

    await expect(page.getByText('Harbor Cafe').first()).toBeVisible();
});
