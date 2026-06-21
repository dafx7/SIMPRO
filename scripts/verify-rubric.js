const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  // Login as dosen
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.fill('input[type=email]', 'dosen3@wilmar.ac.id')
  await page.fill('input[type=password]', 'Dosen123!')
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|proposals)/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  console.log('Logged in, URL:', page.url())

  // Find a proposal with a review form
  await page.goto('http://localhost:3000/proposals', { waitUntil: 'networkidle' })
  const links = page.locator('a[href*="/proposals/"]')
  const count = await links.count()
  console.log('Proposal links found:', count)

  let foundForm = false
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href')
    await page.goto('http://localhost:3000' + href, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const rubrikBtns = page.locator('button').filter({ hasText: 'Rubrik' })
    const n = await rubrikBtns.count()
    console.log('Rubrik buttons on', href, ':', n)
    if (n > 0) { foundForm = true; break }
  }

  if (!foundForm) {
    console.log('ERROR: No review form found with Rubrik buttons')
    // Take screenshot of current state for debugging
    await page.screenshot({ path: 'screenshots/verify-debug.png' })
    await browser.close()
    process.exit(1)
  }

  // Screenshot 1: initial form (before interaction)
  await page.screenshot({ path: 'screenshots/verify-01-form-initial.png', fullPage: false })
  console.log('SS1: initial form saved')

  // Count Rubrik buttons
  const allRubrik = page.locator('button').filter({ hasText: 'Rubrik' })
  const rubrikCount = await allRubrik.count()
  console.log('CHECK criteria buttons count (expect 4):', rubrikCount)

  // Expand first rubric (Orisinalitas)
  await allRubrik.first().click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'screenshots/verify-02-rubrik-expanded.png', fullPage: false })
  console.log('SS2: rubrik expanded saved')

  const panelHeader = await page.locator('text=Panduan Penilaian').count()
  const sangat = await page.locator('text=Sangat Orisinal').count()
  const notOrig = await page.locator('text=Tidak Orisinal').count()
  console.log('CHECK panel header visible (expect 1):', panelHeader)
  console.log('CHECK "Sangat Orisinal" row (expect 1):', sangat)
  console.log('CHECK "Tidak Orisinal" row (expect 1):', notOrig)

  // Close rubric first
  const closeBtn = page.locator('button:has(.lucide-x), button:has([class*=lucide-x])')
  if (await closeBtn.count() > 0) {
    await closeBtn.first().click()
    await page.waitForTimeout(300)
  }

  // Click 4th star for first criteria (Orisinalitas) - stars are 0-indexed buttons
  const starBtns = page.locator('button:has(.lucide-star)')
  const starCount = await starBtns.count()
  console.log('Total star buttons (expect 20):', starCount)

  await starBtns.nth(3).click() // 4th star of criteria 1
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'screenshots/verify-03-score-label.png', fullPage: false })
  console.log('SS3: after clicking star 4 saved')

  const liveLabel = await page.locator('text=4 — Orisinal').count()
  console.log('CHECK live label "4 — Orisinal" (expect 1):', liveLabel)

  // Fill all 4 criteria with score 4 to trigger green verdict
  await starBtns.nth(3).click()  // criteria 1, star 4
  await page.waitForTimeout(150)
  await starBtns.nth(8).click()  // criteria 2, star 4
  await page.waitForTimeout(150)
  await starBtns.nth(13).click() // criteria 3, star 4
  await page.waitForTimeout(150)
  await starBtns.nth(18).click() // criteria 4, star 4
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'screenshots/verify-04-summary-card-green.png', fullPage: false })
  console.log('SS4: summary card (green verdict) saved')

  const summaryHeader = await page.locator('text=Ringkasan Penilaian').count()
  const greenVerdict = await page.locator('text=Kemungkinan Disetujui').count()
  console.log('CHECK summary card header (expect 1):', summaryHeader)
  console.log('CHECK green verdict avg>=4 (expect 1):', greenVerdict)

  // Now set score 2 on all criteria for red verdict
  await starBtns.nth(1).click()  // criteria 1, star 2
  await page.waitForTimeout(150)
  await starBtns.nth(6).click()  // criteria 2, star 2
  await page.waitForTimeout(150)
  await starBtns.nth(11).click() // criteria 3, star 2
  await page.waitForTimeout(150)
  await starBtns.nth(16).click() // criteria 4, star 2
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'screenshots/verify-05-summary-card-red.png', fullPage: false })
  console.log('SS5: summary card (red verdict) saved')

  const redVerdict = await page.locator('text=Kemungkinan Ditolak').count()
  console.log('CHECK red verdict avg<2.5 (expect 1):', redVerdict)

  // Set mixed scores for yellow verdict (avg ~3.0)
  await starBtns.nth(2).click()  // criteria 1, star 3
  await page.waitForTimeout(150)
  await starBtns.nth(7).click()  // criteria 2, star 3
  await page.waitForTimeout(150)
  await starBtns.nth(12).click() // criteria 3, star 3
  await page.waitForTimeout(150)
  await starBtns.nth(17).click() // criteria 4, star 3
  await page.waitForTimeout(500)

  await page.screenshot({ path: 'screenshots/verify-06-summary-card-yellow.png', fullPage: false })
  console.log('SS6: summary card (yellow verdict) saved')

  const yellowVerdict = await page.locator('text=Kemungkinan Perlu Revisi').count()
  console.log('CHECK yellow verdict 2.5<=avg<4 (expect 1):', yellowVerdict)

  await browser.close()
  console.log('\nDONE — all screenshots saved to screenshots/')
})()
