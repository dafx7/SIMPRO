/**
 * Automated verification of all 5 demo scenarios.
 * Logs pass/fail for each check and prints final summary.
 */
const { chromium } = require('playwright')

const BASE = 'http://localhost:3000'
const AI   = 'http://localhost:8000'

const results = []

function check(label, passed, detail = '') {
  results.push({ label, passed, detail })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${label}${detail ? ': ' + detail : ''}`)
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type=email]', email)
  await page.fill('input[type=password]', password)
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(dashboard|proposals|admin)/, { timeout: 12000 })
  await page.waitForLoadState('networkidle')
}

async function logout(page) {
  try {
    const btn = page.locator('button').filter({ hasText: /keluar|logout/i })
    if (await btn.count() > 0) { await btn.first().click(); await page.waitForTimeout(1200) }
    else { await page.goto(`${BASE}/api/auth/signout`); await page.waitForTimeout(1000) }
  } catch { await page.goto(`${BASE}/login`) }
}

;(async () => {
  console.log('=== DEMO READINESS VERIFICATION ===\n')

  // ── Pre-check: servers up ─────────────────────────────────────────────────
  try {
    const r1 = await fetch(`${BASE}/login`)
    check('Server Next.js up', r1.ok, `HTTP ${r1.status}`)
  } catch { check('Server Next.js up', false, 'Connection refused') }

  try {
    const r2 = await fetch(`${AI}/health`)
    const body = await r2.json()
    check('Server AI up', r2.ok, body.status || `HTTP ${r2.status}`)
  } catch { check('Server AI up', false, 'Connection refused') }

  console.log('\n--- DEMO 1: AI Rekomendasi Penguji ---')

  // Direct API call to AI service for P3
  try {
    const res = await fetch(`${AI}/recommend-penguji`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: 'seed-proposal-3', topN: 5 }),
    })
    const data = await res.json()

    check('AI /recommend-penguji responds', res.ok, `${data.recommendations?.length ?? 0} results`)

    if (data.recommendations?.length > 0) {
      const top1 = data.recommendations[0]
      const top2 = data.recommendations[1]
      console.log('  Top recommendations:')
      data.recommendations.forEach((r, i) => {
        console.log(`    ${i+1}. ${r.fullName} (${r.expertise}) → score ${(r.similarityScore * 100).toFixed(1)}%`)
      })

      // Dr. Andi Pratama should be in top 2
      const andiInTop2 = data.recommendations.slice(0, 2).some(r => r.fullName?.includes('Andi'))
      const andiRank = data.recommendations.findIndex(r => r.fullName?.includes('Andi')) + 1
      check('Dr. Andi Pratama muncul di top 2', andiInTop2, andiInTop2 ? `rank ${andiRank}` : 'not found')

      // Non-relevant dosen (akuntansi, pariwisata) should score lower than Andi
      const andiScore = data.recommendations.find(r => r.fullName?.includes('Andi'))?.similarityScore ?? 0
      const akuntansiScore = data.recommendations.find(r => r.fullName?.includes('Siti'))?.similarityScore ?? 0
      const pariwisataScore = data.recommendations.find(r => r.fullName?.includes('Reza'))?.similarityScore ?? 0
      check('Dosen relevan (Andi) skor > dosen Akuntansi', andiScore > akuntansiScore,
        `Andi ${(andiScore*100).toFixed(1)}% vs Akuntansi ${(akuntansiScore*100).toFixed(1)}%`)
      check('Dosen relevan (Andi) skor > dosen Pariwisata', andiScore > pariwisataScore,
        `Andi ${(andiScore*100).toFixed(1)}% vs Pariwisata ${(pariwisataScore*100).toFixed(1)}%`)
    }
  } catch (e) { check('AI recommendation call', false, e.message) }

  console.log('\n--- DEMO 2: Similarity Detection ---')

  try {
    const res = await fetch(`${AI}/check-similarity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId: 'seed-proposal-4' }),
    })
    const data = await res.json()

    check('AI /check-similarity responds', res.ok)
    check(`isFlagged = true (score > threshold)`, data.isFlagged === true,
      `highest ${(data.highestScore * 100).toFixed(1)}%, threshold ${(data.threshold * 100).toFixed(0)}%`)
    check('P3 (CNN Hama Padi) muncul sebagai similar', data.similarProposals?.some(p => p.proposalId === 'seed-proposal-3'),
      data.similarProposals?.map(p => `${p.title?.slice(0,30)} ${(p.similarityScore*100).toFixed(1)}%`).join(', '))
  } catch (e) { check('Similarity check call', false, e.message) }

  console.log('\n--- DEMO 3–5: Browser UI Verification ---')

  const browser = await chromium.launch({ headless: true })
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Demo 3 — Full Workflow: mhs1 sees P1 APPROVED + P3 SUBMITTED
  try {
    await login(page, 'mhs1@wilmar.ac.id', 'Mahasiswa123!')
    await page.goto(`${BASE}/proposals`, { waitUntil: 'networkidle' })

    const pageText = await page.textContent('body')
    check('Demo 3: mhs1 dapat login', page.url().includes('/proposals'), page.url())
    check('Demo 3: P1 (Inventaris) muncul di list', pageText?.includes('Inventaris'), '')
    check('Demo 3: P3 (CNN Hama Padi) muncul di list', pageText?.includes('Hama Padi') || pageText?.includes('CNN'), '')

    // Open P1 and verify APPROVED + adminNotes
    await page.goto(`${BASE}/proposals/seed-proposal-1`, { waitUntil: 'networkidle' })
    const p1Text = await page.textContent('body')
    check('Demo 3: P1 status APPROVED terlihat', p1Text?.includes('Disetujui') || p1Text?.includes('APPROVED'), '')
    check('Demo 3: P1 memiliki catatan admin', p1Text?.includes('Lanjutkan ke tahap seminar'), '')

    // Open P3 and verify SUBMITTED
    await page.goto(`${BASE}/proposals/seed-proposal-3`, { waitUntil: 'networkidle' })
    const p3Text = await page.textContent('body')
    check('Demo 3: P3 status SUBMITTED terlihat', p3Text?.includes('Diajukan') || p3Text?.includes('SUBMITTED'), '')
  } catch (e) { check('Demo 3 browser check', false, e.message) }

  // Demo 4 — Revision Flow: mhs4 sees P5 REVISION
  try {
    await logout(page)
    await login(page, 'mhs4@wilmar.ac.id', 'Mahasiswa123!')
    await page.goto(`${BASE}/proposals`, { waitUntil: 'networkidle' })

    const p4ListText = await page.textContent('body')
    check('Demo 4: mhs4 (Diana Permata) dapat login', page.url().includes('/proposals'), page.url())
    check('Demo 4: P5 (IDS) muncul di list mhs4', p4ListText?.includes('Intrusion Detection') || p4ListText?.includes('IDS'), '')

    await page.goto(`${BASE}/proposals/seed-proposal-5`, { waitUntil: 'networkidle' })
    const p5Text = await page.textContent('body')
    check('Demo 4: P5 status REVISION terlihat', p5Text?.includes('Perlu Revisi') || p5Text?.includes('REVISION'), '')
    check('Demo 4: P5 catatan admin terlihat', p5Text?.includes('Perjelas teknik preprocessing') || p5Text?.includes('confusion matrix'), '')
  } catch (e) { check('Demo 4 browser check', false, e.message) }

  // Demo 5 — Dosen View: dosen2 sees P2 as pembimbing
  try {
    await logout(page)
    await login(page, 'dosen2@wilmar.ac.id', 'Dosen123!')
    await page.goto(`${BASE}/proposals`, { waitUntil: 'networkidle' })

    const dosenText = await page.textContent('body')
    check('Demo 5: dosen2 (Dr. Siti Rahayu) dapat login', page.url().includes('/proposals'), page.url())
    check('Demo 5: P2 (E-Filing) muncul di dashboard dosen', dosenText?.includes('E-Filing') || dosenText?.includes('Pajak'), '')

    await page.goto(`${BASE}/proposals/seed-proposal-2`, { waitUntil: 'networkidle' })
    const p2Text = await page.textContent('body')
    check('Demo 5: dosen2 tercatat sebagai pembimbing P2', p2Text?.includes('Siti Rahayu'), '')
    check('Demo 5: P2 status UNDER_REVIEW terlihat', p2Text?.includes('Dalam Penilaian') || p2Text?.includes('UNDER_REVIEW'), '')
  } catch (e) { check('Demo 5 browser check', false, e.message) }

  // Demo 1 visual — admin sees AI modal on P3
  try {
    await logout(page)
    await login(page, 'admin@wilmar.ac.id', 'Admin123!')
    await page.goto(`${BASE}/proposals/seed-proposal-3`, { waitUntil: 'networkidle' })

    const hasAssignBtn = await page.locator('button').filter({ hasText: /penguji/i }).count()
    check('Demo 1 UI: Tombol Tugaskan Penguji tersedia di P3', hasAssignBtn > 0, `${hasAssignBtn} buttons`)

    if (hasAssignBtn > 0) {
      await page.locator('button').filter({ hasText: /penguji/i }).first().click()
      await page.waitForTimeout(3500) // wait for AI fetch
      const modalText = await page.textContent('body')
      check('Demo 1 UI: Modal terbuka dengan konten AI', modalText?.includes('Rekomendasi') || modalText?.includes('Andi') || modalText?.includes('skor'), '')
      await page.screenshot({ path: 'screenshots/demo1-ai-modal.png' })
      console.log('  → Screenshot: screenshots/demo1-ai-modal.png')
    }
  } catch (e) { check('Demo 1 UI admin modal', false, e.message) }

  await browser.close()

  // ── Final Summary ──────────────────────────────────────────────────────────
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  console.log('\n' + '='.repeat(45))
  console.log(`FINAL: ${passed} LULUS / ${failed} GAGAL / ${results.length} total`)
  console.log('='.repeat(45))
  if (failed > 0) {
    console.log('\nGAGAL:')
    results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.label}${r.detail ? ': ' + r.detail : ''}`))
  } else {
    console.log('\n🎉 SEMUA DEMO SIAP!')
  }
})()
