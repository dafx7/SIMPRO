const { chromium } = require('playwright')
const path = require('path')

const BASE_URL = 'http://localhost:3000'
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  // Login as admin
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', 'admin@wilmar.ac.id')
  await page.fill('input[type="password"]', 'Admin123!')
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')

  // Navigate to admin proposals list
  await page.goto(`${BASE_URL}/admin/proposals`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Find a link to the UNDER_REVIEW proposal
  const proposalLink = page.locator('a[href*="seed-proposal-2"]')
  let detailUrl
  if (await proposalLink.count() > 0) {
    const href = await proposalLink.first().getAttribute('href')
    detailUrl = `${BASE_URL}${href}`
  } else {
    // Try any proposal link
    const anyLink = page.locator('a[href*="/proposals/"]')
    if (await anyLink.count() > 0) {
      const href = await anyLink.first().getAttribute('href')
      detailUrl = `${BASE_URL}${href}`
    }
  }

  console.log('Navigating to:', detailUrl)
  await page.goto(detailUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Screenshot the detail page first
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-proposal-detail-admin.png'), fullPage: false })
  console.log('✓ Updated 08-proposal-detail-admin.png')

  // Try to find the modal trigger button
  const allBtns = await page.locator('button').allTextContents()
  console.log('Buttons on page:', allBtns.map(t => t.trim()).filter(Boolean))

  const pengujiBtn = page.locator('button').filter({ hasText: /penguji/i })
  if (await pengujiBtn.count() > 0) {
    await pengujiBtn.first().click()
    console.log('Modal opened, waiting for AI recommendation...')
    await page.waitForTimeout(3500)
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-assign-penguji-modal.png') })
    console.log('✓ 09-assign-penguji-modal.png saved')
  } else {
    // Find SUBMITTED proposal
    console.log('No penguji button found. Looking for SUBMITTED proposal...')
    await page.goto(`${BASE_URL}/admin/proposals`, { waitUntil: 'networkidle' })

    // Look for table rows
    const rows = await page.locator('tr, [role="row"]').all()
    console.log('Rows found:', rows.length)

    // Try clicking each row until we find one with the penguji button
    const links = page.locator('a[href*="/proposals/"]')
    const count = await links.count()
    console.log('Proposal links found:', count)

    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await links.nth(i).getAttribute('href')
      if (!href) continue
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      const btn = page.locator('button').filter({ hasText: /penguji/i })
      if (await btn.count() > 0) {
        await btn.first().click()
        await page.waitForTimeout(3500)
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-assign-penguji-modal.png') })
        console.log(`✓ 09-assign-penguji-modal.png from ${href}`)
        break
      }
    }
  }

  await browser.close()
  console.log('Done.')
})()
