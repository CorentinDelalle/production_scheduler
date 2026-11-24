import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** A production block on the timeline, found by customer name. */
function block(page: Page, customer: string): Locator {
    return page
        .locator('.vis-item.tl-production')
        .filter({ hasText: customer });
}

/** Asserts that a block sits in the row of the given machine. */
async function expectOnMachine(page: Page, item: Locator, machine: string) {
    const row = await page
        .locator('.vis-labelset .vis-label')
        .filter({ hasText: machine })
        .boundingBox();
    const box = await item.boundingBox();

    expect(row).not.toBeNull();
    expect(box).not.toBeNull();
    const middle = box!.y + box!.height / 2;
    expect(middle).toBeGreaterThan(row!.y);
    expect(middle).toBeLessThan(row!.y + row!.height);
}

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard?start=2030-01-07');
});

test('the timeline places each order on its machine and flags the late one', async ({
    page,
}) => {
    const onTime = block(page, 'Northwind');
    const late = block(page, 'Late Labels');

    await expect(onTime).toBeVisible();
    await expect(late).toBeVisible();
    await expectOnMachine(page, onTime, 'Machine 1');
    await expectOnMachine(page, late, 'Machine 2');
    await expect(late).toHaveClass(/tl-late/);
    await expect(late).toContainText('LATE');
    await expect(onTime).not.toHaveClass(/tl-late/);
});

test('the timeline shows times in Montreal, whatever the browser timezone', async ({
    page,
}) => {
    await block(page, 'Late Labels').hover();

    await expect(page.locator('.vis-tooltip')).toContainText(
        'Mon 7 Jan, 00:30 to Tue 8 Jan, 06:30',
    );
});

test('a customer name with markup is shown as text on the timeline', async ({
    page,
}) => {
    const item = block(page, 'Northwind');

    await expect(item).toContainText(
        'Northwind <span class="injected">Print</span> & Co',
    );
    await expect(item.locator('.injected')).toHaveCount(0);
});
