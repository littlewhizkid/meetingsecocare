import { test, expect, Page } from '@playwright/test';

/**
 * Grid alignment regression check:
 * 1. Time-column rows are exactly SLOT_HEIGHT (56px) apart.
 * 2. A 09:00–10:30 booking card's top edge sits at the "9:00 AM" row
 *    (cards anchored to 08:00 — catches the "anchored to midnight" bug where
 *    every card was pushed down by 8 hours).
 */

const FUTURE = '2026-12-14'; // a Monday
const SLOT_HEIGHT = 56;
const CARD_TOP_OFFSET = 3; // px inset applied to booking cards

async function signIn(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', 'admin@ecocare.id');
  await page.fill('input[type="password"]', 'admin1234');
  await page.click('button[type="submit"]');
  await expect(page.getByText('ecoCare Meeting Rooms')).toBeVisible();
}

test('booking card aligns with its time row', async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page);

  // create a known booking through the UI: 09:00–10:30, Board Room
  const title = `Alignment Check ${Date.now()}`;
  await page.getByRole('button', { name: 'New Event' }).click();
  await expect(page.getByRole('heading', { name: 'New Booking' })).toBeVisible();
  await expect(page.getByLabel('Meeting Title')).toHaveValue('');

  await page.selectOption('#booking-room', 'board-room');
  await page.fill('#booking-start-date', FUTURE);
  await page.fill('#booking-end-date', FUTURE);
  await expect(page.locator('#booking-start-date')).toHaveValue(FUTURE);
  await page.selectOption('#booking-start-time', '09:00');
  await page.selectOption('#booking-end-time', '10:30');
  await page.fill('#booking-title', title);
  await page.getByRole('button', { name: 'Confirm Booking' }).click();
  await expect(page.getByText(/Booking confirmed/i)).toBeVisible({ timeout: 10_000 });

  // grab the booking id from the toast-triggered grid refresh
  await page.locator('main button', { hasText: /, \d{1,2} \w+ \d{4}/ }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByLabel('Next month').click();
  }
  await page.getByRole('button', { name: '14', exact: true }).click();

  // wait until the card for our booking renders
  const card = page.locator('[data-testid^="booking-card-"]').filter({ hasText: title }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(300);

  // 1) time column rows: adjacent labels exactly SLOT_HEIGHT apart
  const label9 = page.getByTestId('slot-label-09:00');
  const label930 = page.getByTestId('slot-label-09:30');
  await label9.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box9 = await label9.boundingBox();
  const box930 = await label930.boundingBox();
  expect(box9).toBeTruthy();
  expect(box930).toBeTruthy();
  expect(Math.abs(box930!.y - box9!.y - SLOT_HEIGHT)).toBeLessThan(3);

  // 2) card top edge at the 09:00 row (within the deliberate 3px inset)
  const cardBox = await card.boundingBox();
  expect(Math.abs(cardBox!.y - box9!.y - CARD_TOP_OFFSET)).toBeLessThan(4);

  // 3) card height = 3 slots (1h30) minus the 6px gap
  expect(Math.abs(cardBox!.height - (3 * SLOT_HEIGHT - 6))).toBeLessThan(4);
});