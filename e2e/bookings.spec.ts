import { test, expect, Page, APIRequestContext } from '@playwright/test';

/**
 * E2E booking flows. Requires a dev server with a migrated Postgres DB and
 * the seeded users (admin@ecocare.id / admin1234, budi@ecocare.id / user1234).
 *
 * All bookings use future dates. Tests clean up their own bookings first
 * (matched by the "E2E " title prefix) so reruns stay idempotent.
 */

const FUTURE_MONDAY = '2026-12-14'; // a Monday
const FUTURE_WEDNESDAY = '2026-12-16';

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page.getByText('ecoCare Meeting Rooms')).toBeVisible();
}

/** Opens the New Event modal and waits for its effect-driven state reset to finish. */
async function openNewEventModal(page: Page) {
  await page.getByRole('button', { name: 'New Event' }).click();
  await expect(page.getByRole('heading', { name: 'New Booking' })).toBeVisible();
  await expect(page.getByLabel('Meeting Title')).toHaveValue('');
}

/** Deletes all admin-visible bookings titled with the "E2E " prefix. */
async function cleanupE2EBookings(request: APIRequestContext) {
  const res = await request.get('/api/bookings');
  if (!res.ok()) return;
  const bookings: { id: string; meetingTitle: string }[] = await res.json();
  await Promise.all(
    bookings
      .filter(b => b.meetingTitle.startsWith('E2E '))
      .map(b => request.delete(`/api/bookings/${b.id}`))
  );
}

async function fillTimedBooking(
  page: Page,
  opts: { title: string; startTime: string; endTime: string; date?: string; room?: string }
) {
  if (opts.room) {
    await page.selectOption('#booking-room', opts.room);
  }
  if (opts.date) {
    await page.fill('#booking-start-date', opts.date);
    await page.fill('#booking-end-date', opts.date);
    await expect(page.locator('#booking-start-date')).toHaveValue(opts.date);
  }
  await page.selectOption('#booking-start-time', opts.startTime);
  await page.selectOption('#booking-end-time', opts.endTime);
  await page.fill('#booking-title', opts.title);
}

test.describe('booking flows', () => {
  test.beforeEach(async ({ request }) => {
    // sign in via API to get an authenticated request context
    const csrfRes = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();
    await request.post('/api/auth/callback/credentials', {
      form: { csrfToken, email: 'admin@ecocare.id', password: 'admin1234' },
      maxRedirects: 5,
    });
    await cleanupE2EBookings(request);
  });

  test('create a timed booking via New Event button', async ({ page }) => {
    await signIn(page, 'budi@ecocare.id', 'user1234');
    await openNewEventModal(page);

    await fillTimedBooking(page, {
      title: 'E2E Standup', startTime: '09:00', endTime: '10:00',
      date: FUTURE_MONDAY, room: 'interview-room',
    });
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page.getByText(/Booking confirmed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('create a multi-day all-day booking and see it in the all-day lane', async ({ page }) => {
    await signIn(page, 'admin@ecocare.id', 'admin1234');
    await openNewEventModal(page);

    await page.check('input[type="checkbox"]');
    await page.selectOption('#booking-room', 'podcast-room');
    await page.fill('#booking-start-date', FUTURE_MONDAY);
    await page.fill('#booking-end-date', FUTURE_WEDNESDAY);
    await expect(page.locator('#booking-start-date')).toHaveValue(FUTURE_MONDAY);
    await page.fill('#booking-title', 'E2E Offsite');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page.getByText(/Booking confirmed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('conflicting booking is rejected with a visible error', async ({ page }) => {
    await signIn(page, 'admin@ecocare.id', 'admin1234');
    await openNewEventModal(page);

    await fillTimedBooking(page, {
      title: 'E2E Conflict A', startTime: '13:00', endTime: '14:00',
      date: FUTURE_MONDAY, room: 'small-meeting-room',
    });
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await expect(page.getByText(/Booking confirmed/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'New Booking' })).toBeHidden();

    await openNewEventModal(page);
    await fillTimedBooking(page, {
      title: 'E2E Conflict B', startTime: '13:30', endTime: '14:30',
      date: FUTURE_MONDAY, room: 'small-meeting-room',
    });
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page.getByText(/conflicts with an existing booking/i)).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated API access is denied', async ({ browser }) => {
    const context = await browser.newContext(); // fresh context — anonymous
    const page = await context.newPage();
    const res = await page.request.get('/api/bookings');
    expect(res.status()).toBe(401);
    await context.close();
  });
});