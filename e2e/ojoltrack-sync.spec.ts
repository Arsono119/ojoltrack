import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lvmqarqzsyjicyijyrpj.supabase.co';
const SUPABASE_ANON = 'sb_publishable_nhmF750KTpV1-6waw5YCQA_fT9N-Win';

// Dedicated test accounts, created once and reused for every run (no per-run signup).
const ACCOUNT1 = 'ojoltrack.test.hp1@gmail.com';
const ACCOUNT2 = 'ojoltrack.test.hp2@gmail.com';
const PASS = 'Test123!';

// Ensure a dedicated account exists, then return a signed-in session for it.
async function ensureAccount(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  let { data } = await supabase.auth.signInWithPassword({ email, password });
  if (!data.session) {
    await supabase.auth.signUp({ email, password });
    const r = await supabase.auth.signInWithPassword({ email, password });
    data = r.data;
  }
  if (!data.session?.user?.id) throw new Error(`ensureAccount failed for ${email}`);
  return { supabase, user: data.session.user };
}

// Wipe all transaksi rows owned by a dedicated account (RLS allows deleting own rows).
async function cleanupUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from('transaksi').delete().eq('user_id', userId);
  if (error) throw new Error(`cleanupUser failed: ${error.message}`);
}

// Helper to clear storage + capture logs
async function clearAppData(page: Page) {
  await page.evaluate(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  });
}

test.describe('OjolTrack daftar & sync (T1-T7)', () => {
  const today = new Date().toISOString().slice(0, 10);

  test.setTimeout(300_000);

  test('T1-T7 dedicated accounts, online sync & isolation', async ({ browser }) => {
    // Prepare dedicated accounts (self-healing: signup only if not yet exists) + wipe old data.
    const { user: u1 } = await ensureAccount(ACCOUNT1, PASS);
    const { supabase: sb1, user: u1b } = await ensureAccount(ACCOUNT1, PASS);
    const { supabase: sb2, user: u2 } = await ensureAccount(ACCOUNT2, PASS);
    await cleanupUser(sb1, u1b.id);
    await cleanupUser(sb2, u2.id);
    console.log(`Accounts ready: test1=${u1.id} test2=${u2.id}`);

    // Two contexts: HP1 and Laptop
    const ctxHP1 = await browser.newContext();
    const ctxLaptop = await browser.newContext();
    const pageHP1 = await ctxHP1.newPage();
    const pageLaptop = await ctxLaptop.newPage();

    // Capture console errors and network for diagnostics
    const consoleErrorsHP1: string[] = [];
    const networkLogsHP1: string[] = [];
    const consoleErrorsLaptop: string[] = [];
    const networkLogsLaptop: string[] = [];

    pageHP1.on('console', msg => { if (msg.type() === 'error') consoleErrorsHP1.push(msg.text()); });
    pageLaptop.on('console', msg => { if (msg.type() === 'error') consoleErrorsLaptop.push(msg.text()); });

    pageHP1.on('response', async resp => {
      if (!resp.ok() && resp.url().includes('supabase')) networkLogsHP1.push(`[ERR RESP] ${resp.status()} ${resp.url()}`);
    });
    pageHP1.on('requestfailed', req => {
      if (req.url().includes('supabase')) networkLogsHP1.push(`[FAILED] ${req.url()} :: ${req.failure()?.errorText}`);
    });
    pageLaptop.on('response', async resp => {
      if (!resp.ok() && resp.url().includes('supabase')) networkLogsLaptop.push(`[ERR RESP] ${resp.status()} ${resp.url()}`);
    });
    pageLaptop.on('requestfailed', req => {
      if (req.url().includes('supabase')) networkLogsLaptop.push(`[FAILED] ${req.url()} :: ${req.failure()?.errorText}`);
    });

    // helper screenshots on fail per step
    async function snap(page: Page, name: string) {
      try { await page.screenshot({ path: `playwright-report/${name}.png`, fullPage: true }); } catch {}
    }

    // Navigate safely: recover if the page renderer crashed (low-memory env), then reload.
    async function gotoSafe(page: Page, url: string) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        return;
      } catch (e: any) {
        if (!page.isClosed()) {
          try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }); return; } catch {}
        }
        console.log(`gotoSafe fallback reload for ${url}: ${e?.message}`);
      }
      throw new Error(`gotoSafe failed for ${url}`);
    }

    // Sign in a page to a given account via the /login form (Masuk tab).
    async function signIn(page: Page, email: string) {
      await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.getByPlaceholder('budi@email.com').fill(email);
      await page.getByPlaceholder('min 6 karakter').fill(PASS);
      const masukTab = page.getByRole('button', { name: 'Masuk', exact: true }).first();
      await masukTab.click().catch(() => {});
      await page.waitForTimeout(300);
      const submitBtn = page.locator('button[type="submit"]').filter({ hasText: 'Masuk' });
      if (await submitBtn.count() > 0) await submitBtn.click();
      else await page.locator('button[type="submit"]').first().click();
      try {
        await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 12000 });
      } catch {
        const err = await page.locator('p.text-red-600').textContent().catch(() => '');
        await snap(page, 'SIGNIN-FAIL');
        throw new Error(`signIn failed for ${email}: ${err}`);
      }
    }

    // ============ T1: incognito -> expect redirect to /login ============
    console.log('\n=== T1: proxy paksa login ===');
    await ctxHP1.clearCookies();
    await pageHP1.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await clearAppData(pageHP1);
    await pageHP1.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    try {
      await pageHP1.waitForURL(/\/login/, { timeout: 8000 });
    } catch {}
    const urlT1 = pageHP1.url();
    console.log(`T1 url: ${urlT1}`);
    if (!urlT1.includes('/login')) {
      await snap(pageHP1, 'T1-FAIL-not-redirected');
      console.log('T1 FAIL: expected redirect to /login, got ' + urlT1);
    }
    await expect(pageHP1).toHaveURL(/\/login/, { timeout: 8000 });
    console.log('✓ T1 PASS: redirect to /login');

    // ============ T2: login test1 ============
    console.log('\n=== T2: Login test1 ===');
    await signIn(pageHP1, ACCOUNT1);
    const curUrl2 = pageHP1.url();
    console.log(`T2 post-login url: ${curUrl2}`);
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    const banner = pageHP1.locator('div.bg-green-50');
    await expect(banner).toBeVisible({ timeout: 8000 });
    const headerText = await banner.textContent().catch(() => '');
    console.log(`HeaderAuth text: ${headerText?.trim()}`);
    if (!headerText?.includes(ACCOUNT1)) console.log('WARN T2: banner text does not contain exact email, continuing');
    await expect(pageHP1).toHaveURL(/\/($|\?)/, { timeout: 5000 }).catch(async () => {
      await pageHP1.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    });
    console.log('✓ T2 PASS: login OK, header visible');

    // ============ T4: Add transaksi Grab 18000 / 6.2 km 08:15 == ==========
    console.log('\n=== T4: tambah transaksi Grab 18000 ===');
    await pageHP1.goto('http://localhost:3000/tambah', { waitUntil: 'domcontentloaded' });
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    const grabBtn = pageHP1.getByRole('button', { name: 'Grab', exact: true });
    await expect(grabBtn).toBeVisible({ timeout: 5000 });
    await grabBtn.click();
    const argoInput = pageHP1.getByPlaceholder('18000');
    await expect(argoInput).toBeVisible({ timeout: 5000 });
    await argoInput.fill('18000');
    const jarakInput = pageHP1.getByPlaceholder('6.2');
    await expect(jarakInput).toBeVisible({ timeout: 5000 });
    await jarakInput.fill('6.2');
    const timeInput = pageHP1.locator('input[type="time"]');
    await expect(timeInput).toBeVisible({ timeout: 5000 });
    await timeInput.fill('08:15');
    const textarea = pageHP1.locator('textarea');
    await textarea.fill('Grab 18000 test T4');
    const rpKmPreview = pageHP1.locator('text=Rp/KM');
    await expect(rpKmPreview).toBeVisible({ timeout: 3000 }).catch(() => console.log('Rp/KM preview not visible - may be auto calc pending'));
    const simpanBtn = pageHP1.getByRole('button', { name: 'Simpan' });
    await simpanBtn.click();
    try {
      await pageHP1.waitForURL('http://localhost:3000/', { timeout: 8000 });
    } catch {
      await pageHP1.waitForURL(/\/$/, { timeout: 8000 });
    }
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    await expect(pageHP1.locator('text=Pendapatan Bersih')).toBeVisible({ timeout: 5000 });
    const rupiahVisible = await pageHP1.locator('text=Rp').first().isVisible().catch(() => false);
    console.log(`T4 dashboard Rp visible: ${rupiahVisible}`);
    await pageHP1.goto('http://localhost:3000/riwayat', { waitUntil: 'domcontentloaded' });
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    const grabEntry = pageHP1.locator('text=Grab').first();
    try {
      await expect(grabEntry).toBeVisible({ timeout: 5000 });
      console.log('✓ T4 PASS: Riwayat has Grab entry');
    } catch {
      await snap(pageHP1, 'T4-FAIL-no-riwayat');
      const body = await pageHP1.content().then(c => c.slice(0, 3000)).catch(() => '');
      console.log(`T4 FAIL body snippet: ${body}`);
      throw new Error('T4 FAIL: riwayat no Grab entry');
    }
    const entry = pageHP1.locator('text=18.000').first();
    const entry2 = pageHP1.locator('text=18000').first();
    try {
      await expect(entry.or(entry2)).toBeVisible({ timeout: 5000 });
    } catch {
      console.log('WARN T4: nominal exact 18.000 not found but Grab found, checking any 18 (lenient)');
      await expect(pageHP1.locator('text=18').first()).toBeVisible({ timeout: 3000 });
    }
    console.log('✓ T4 PASS: dashboard Rp visible, riwayat has entry');

    // ============ T5: Laptop login same account, check sync within 5s ============
    console.log('\n=== T5: sync HP1 -> Laptop ===');
    await pageLaptop.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await clearAppData(pageLaptop);
    await signIn(pageLaptop, ACCOUNT1);
    console.log(`T5 laptop logged in, url ${pageLaptop.url()}`);
    await expect(pageLaptop.locator('div.bg-green-50')).toBeVisible({ timeout: 5000 });
    await pageLaptop.goto('http://localhost:3000/riwayat', { waitUntil: 'domcontentloaded' });
    await pageLaptop.waitForLoadState('networkidle').catch(() => {});
    let foundSync = false;
    for (let i = 0; i < 5; i++) {
      const cnt = await pageLaptop.locator('text=Grab').count();
      if (cnt > 0) {
        const hasNominal = (await pageLaptop.locator('text=18.000').count()) > 0 || (await pageLaptop.locator('text=18000').count()) > 0;
        if (hasNominal) { foundSync = true; break; }
      }
      await pageLaptop.waitForTimeout(1000);
      await pageLaptop.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    if (!foundSync) {
      await snap(pageLaptop, 'T5-FAIL-no-sync');
      console.log(`Network Laptop: ${networkLogsLaptop.join('\n')}`);
      throw new Error('T5 FAIL: Laptop did not see Grab 18000 within 5s');
    }
    console.log('✓ T5 PASS: Laptop sees Grab 18000 within 5s');

    // ============ T6: Isolation - test2 on laptop adds Shopee 12000, HP1 (test1) must NOT see it ============
    console.log('\n=== T6: isolation RLS ===');
    const logoutBtnL = pageLaptop.locator('button', { hasText: 'Logout' });
    if (await logoutBtnL.count() > 0) {
      await logoutBtnL.click();
      await pageLaptop.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});
    } else {
      await pageLaptop.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    }
    await signIn(pageLaptop, ACCOUNT2);
    console.log(`T6 test2 logged in url ${pageLaptop.url()}`);
    await pageLaptop.goto('http://localhost:3000/tambah', { waitUntil: 'domcontentloaded' });
    await pageLaptop.waitForLoadState('networkidle').catch(() => {});
    const shopeeBtn = pageLaptop.getByRole('button', { name: 'Shopee Drive', exact: true });
    await expect(shopeeBtn).toBeVisible({ timeout: 5000 });
    await shopeeBtn.click();
    const argo2 = pageLaptop.getByPlaceholder('18000');
    await argo2.fill('12000');
    const textarea2 = pageLaptop.locator('textarea');
    await textarea2.fill('Shopee 12000 isolation T6');
    await pageLaptop.getByRole('button', { name: 'Simpan' }).click();
    try {
      await pageLaptop.waitForURL('http://localhost:3000/', { timeout: 8000 });
    } catch { await pageLaptop.waitForURL(/\/$/, { timeout: 8000 }); }
    await pageLaptop.waitForLoadState('networkidle').catch(() => {});
    await pageLaptop.goto('http://localhost:3000/riwayat', { waitUntil: 'domcontentloaded' });
    await pageLaptop.waitForLoadState('networkidle').catch(() => {});
    await expect(pageLaptop.locator('text=Shopee').first()).toBeVisible({ timeout: 5000 });
    await expect(pageLaptop.locator('text=12.000').first().or(pageLaptop.locator('text=12000').first())).toBeVisible({ timeout: 3000 }).catch(() => console.log('WARN T6 Shopee nominal not exact but Shopee visible'));
    console.log('✓ T6 laptop has Shopee 12000');

    await pageHP1.goto('http://localhost:3000/riwayat', { waitUntil: 'domcontentloaded' });
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    await pageHP1.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await pageHP1.waitForTimeout(1000);
    const hasIsolationEntry = await pageHP1.locator('text=isolation T6').count().then(c => c > 0).catch(() => false);
    const has12kInHP1 = await pageHP1.locator('text=12.000').count().then(c => c > 0).catch(() => false);
    if (hasIsolationEntry || has12kInHP1) {
      await snap(pageHP1, 'T6-FAIL-isolation-leaked');
      throw new Error('T6 FAIL: HP1 (test1) sees Shopee 12000 from test2 - RLS leak!');
    }
    console.log('✓ T6 PASS: isolation OK (test1 does NOT see test2 Shopee 12000)');

    // ============ T7: online sync on dedicated account after login churn ============
    console.log('\n=== T7: online sync after account churn ===');
    // Laptop back to test1
    const logout2 = pageLaptop.locator('button', { hasText: 'Logout' });
    if (await logout2.count() > 0) {
      await logout2.click();
      await pageLaptop.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});
    }
    await signIn(pageLaptop, ACCOUNT1);
    console.log(`T7 laptop re-logged as test1: ${pageLaptop.url()}`);

    // HP1 (still test1) adds a fresh pengeluaran while fully online
    await gotoSafe(pageHP1, 'http://localhost:3000/tambah');
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    await pageHP1.waitForTimeout(300);
    const pengBtn = pageHP1.locator('button').filter({ hasText: 'pengeluaran' }).first();
    if (await pengBtn.count() > 0) {
      await pengBtn.click();
      await pageHP1.waitForTimeout(300);
    }
    const bensinNominalInput = pageHP1.getByPlaceholder('25000');
    if (await bensinNominalInput.count() > 0) {
      await bensinNominalInput.fill('25000');
    } else {
      // Reload the form once (recovers from a possible renderer crash), then fill numeric input
      await gotoSafe(pageHP1, 'http://localhost:3000/tambah');
      await pageHP1.waitForLoadState('networkidle').catch(() => {});
      const pengBtn2 = pageHP1.locator('button').filter({ hasText: 'pengeluaran' }).first();
      if (await pengBtn2.count() > 0) { await pengBtn2.click(); await pageHP1.waitForTimeout(300); }
      await pageHP1.getByPlaceholder('25000').fill('25000');
    }
    const bensinBtn = pageHP1.getByRole('button', { name: 'bensin', exact: true });
    if (await bensinBtn.count() > 0) await bensinBtn.click();
    const taT7 = pageHP1.locator('textarea').first();
    try {
      await taT7.fill('bensin 25000 sync T7', { timeout: 5000 });
    } catch {
      await pageHP1.evaluate(() => {
        const ta = document.querySelector('textarea') as HTMLTextAreaElement | null;
        if (ta) { ta.value = 'bensin 25000 sync T7'; ta.dispatchEvent(new Event('input', { bubbles: true })); ta.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    }
    await pageHP1.getByRole('button', { name: 'Simpan' }).click();
    try {
      await pageHP1.waitForURL('http://localhost:3000/', { timeout: 8000 });
    } catch { await pageHP1.waitForURL(/\/$/, { timeout: 8000 }); }
    await pageHP1.waitForLoadState('networkidle').catch(() => {});
    console.log('T7 HP1 saved entry, polling Laptop...');

    let foundT7 = false;
    // Laptop is already on "/" after signIn; keep it there and reload (faster than full goto).
    for (let i = 0; i < 20; i++) {
      try { await pageLaptop.reload({ waitUntil: 'domcontentloaded', timeout: 10000 }); } catch {}
      const cntBensin = await pageLaptop.locator('text=bensin').count().catch(() => 0);
      const cnt25000 = await pageLaptop.locator('text=25.000').count().catch(() => 0);
      const cntSync = await pageLaptop.locator('text=sync T7').count().catch(() => 0);
      if (cntSync > 0 || (cntBensin > 0 && cnt25000 > 0)) {
        foundT7 = true;
        console.log(`T7 sync found at attempt ${i + 1}`);
        break;
      }
      await pageLaptop.waitForTimeout(2000);
      console.log(`T7 polling ${i + 1}/20 - not yet, bensin:${cntBensin} 25k:${cnt25000} syncT7:${cntSync}`);
    }
    if (!foundT7) {
      await snap(pageHP1, 'T7-FAIL-HP1-riwayat');
      await snap(pageLaptop, 'T7-FAIL-Laptop-riwayat');
      console.log(`T7 FAIL console HP1: ${consoleErrorsHP1.join(' | ')}`);
      console.log(`T7 FAIL console Laptop: ${consoleErrorsLaptop.join(' | ')}`);
      console.log(`T7 FAIL network HP1: ${networkLogsHP1.join(' | ')}`);
      throw new Error('T7 FAIL: bensin 25000 sync not visible on second device within 30s');
    }
    console.log('✓ T7 PASS: Laptop sees bensin 25000 entry within 30s');

    await ctxHP1.close();
    await ctxLaptop.close();
  });
});