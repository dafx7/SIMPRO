const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:3000'
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots')

const results = { success: [], failed: [] }

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

async function capture(page, filename, description) {
  const filepath = path.join(SCREENSHOTS_DIR, filename)
  try {
    await page.screenshot({ path: filepath, fullPage: false })
    log(`✓ ${filename} — ${description}`)
    results.success.push(filename)
  } catch (err) {
    log(`✗ ${filename} — FAILED: ${err.message}`)
    results.failed.push({ filename, reason: err.message })
  }
}

async function loginAs(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', email)
  await page.fill('input[type="password"], input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|proposals|admin)/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}

async function logout(page) {
  try {
    // Try clicking user menu / logout button
    const logoutBtn = page.locator('button:has-text("Keluar"), a:has-text("Keluar"), button:has-text("Logout"), a:has-text("Logout")')
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click()
    } else {
      // Open user dropdown first
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Admin"), button:has-text("Dosen"), button:has-text("Mhs")')
      if (await userMenu.count() > 0) {
        await userMenu.first().click()
        await page.waitForTimeout(500)
        await page.locator('text=Keluar, text=Logout').first().click()
      } else {
        await page.goto(`${BASE_URL}/api/auth/signout`, { waitUntil: 'networkidle' })
        const signoutBtn = page.locator('button[type="submit"]')
        if (await signoutBtn.count() > 0) await signoutBtn.click()
      }
    }
    await page.waitForTimeout(1000)
  } catch {
    // Force signout via URL
    try {
      await page.goto(`${BASE_URL}/api/auth/signout`)
      await page.waitForTimeout(1000)
      const btn = page.locator('button[type="submit"]')
      if (await btn.count() > 0) await btn.click()
      await page.waitForTimeout(1000)
    } catch { /* ignore */ }
  }
}

;(async () => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()

  // 01 — Login page
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await capture(page, '01-login.png', 'Login page')
  } catch (err) {
    log(`✗ 01-login.png — ${err.message}`)
    results.failed.push({ filename: '01-login.png', reason: err.message })
  }

  // 02 — Dashboard Mahasiswa
  try {
    await loginAs(page, 'mhs1@wilmar.ac.id', 'Mahasiswa123!')
    await capture(page, '02-dashboard-mahasiswa.png', 'Dashboard mahasiswa')
  } catch (err) {
    log(`✗ 02-dashboard-mahasiswa.png — ${err.message}`)
    results.failed.push({ filename: '02-dashboard-mahasiswa.png', reason: err.message })
  }

  // 03 — Form Proposal Step 1 (empty)
  try {
    await page.goto(`${BASE_URL}/proposals/new`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await capture(page, '03-form-proposal-step1.png', 'Form proposal step 1 kosong')
  } catch (err) {
    log(`✗ 03-form-proposal-step1.png — ${err.message}`)
    results.failed.push({ filename: '03-form-proposal-step1.png', reason: err.message })
  }

  // 04 — Form filled
  try {
    const titleInput = page.locator('input[name="title"], input[placeholder*="judul" i]').first()
    await titleInput.fill('Sistem Deteksi Hama Tanaman Menggunakan Computer Vision')
    const abstractInput = page.locator('textarea[name="abstract"], textarea[placeholder*="abstrak" i]').first()
    await abstractInput.fill('Penelitian ini mengusulkan pengembangan sistem cerdas berbasis computer vision dan deep learning untuk mendeteksi hama tanaman padi secara otomatis di lahan pertanian Indonesia, guna meningkatkan produktivitas petani.')
    await capture(page, '04-form-proposal-filled.png', 'Form proposal terisi')
  } catch (err) {
    log(`✗ 04-form-proposal-filled.png — ${err.message}`)
    results.failed.push({ filename: '04-form-proposal-filled.png', reason: err.message })
  }

  // 05 — Proposal list mahasiswa
  try {
    await page.goto(`${BASE_URL}/proposals`, { waitUntil: 'networkidle' })
    await capture(page, '05-proposal-list-mahasiswa.png', 'Daftar proposal mahasiswa')
  } catch (err) {
    log(`✗ 05-proposal-list-mahasiswa.png — ${err.message}`)
    results.failed.push({ filename: '05-proposal-list-mahasiswa.png', reason: err.message })
  }

  // 06 — Dashboard Admin
  try {
    await logout(page)
    await loginAs(page, 'admin@wilmar.ac.id', 'Admin123!')
    await capture(page, '06-dashboard-admin.png', 'Dashboard admin')
  } catch (err) {
    log(`✗ 06-dashboard-admin.png — ${err.message}`)
    results.failed.push({ filename: '06-dashboard-admin.png', reason: err.message })
  }

  // 07 — Semua Proposal admin
  try {
    await page.goto(`${BASE_URL}/admin/proposals`, { waitUntil: 'networkidle' })
    await capture(page, '07-proposal-list-admin.png', 'Daftar proposal admin')
  } catch (err) {
    log(`✗ 07-proposal-list-admin.png — ${err.message}`)
    results.failed.push({ filename: '07-proposal-list-admin.png', reason: err.message })
  }

  // 08 — Proposal detail admin
  let detailUrl = null
  try {
    // Click first submitted proposal
    const rows = page.locator('table tbody tr, [data-proposal-id]')
    if (await rows.count() > 0) {
      await rows.first().click()
      await page.waitForLoadState('networkidle')
      detailUrl = page.url()
    } else {
      // Try direct link
      const links = page.locator('a[href*="/proposals/"]')
      if (await links.count() > 0) {
        detailUrl = await links.first().getAttribute('href')
        await page.goto(`${BASE_URL}${detailUrl}`, { waitUntil: 'networkidle' })
        detailUrl = page.url()
      }
    }
    await capture(page, '08-proposal-detail-admin.png', 'Detail proposal admin')
  } catch (err) {
    log(`✗ 08-proposal-detail-admin.png — ${err.message}`)
    results.failed.push({ filename: '08-proposal-detail-admin.png', reason: err.message })
  }

  // 09 — Assign Penguji modal with AI recommendations
  try {
    // Find and click the assign penguji button
    const assignBtn = page.locator('button:has-text("Tugaskan Penguji"), button:has-text("Penguji")')
    if (await assignBtn.count() > 0) {
      await assignBtn.first().click()
      await page.waitForTimeout(3000) // Wait for AI fetch
      await capture(page, '09-assign-penguji-modal.png', 'Modal tugaskan penguji dengan AI')
    } else {
      log('⚠ 09 — Tombol Tugaskan Penguji tidak ditemukan, skip')
      results.failed.push({ filename: '09-assign-penguji-modal.png', reason: 'Button not found on current page' })
    }
  } catch (err) {
    log(`✗ 09-assign-penguji-modal.png — ${err.message}`)
    results.failed.push({ filename: '09-assign-penguji-modal.png', reason: err.message })
  }

  // Close modal if open
  try {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  } catch { /* ignore */ }

  // 10 — Dashboard Dosen
  try {
    await logout(page)
    await loginAs(page, 'dosen1@wilmar.ac.id', 'Dosen123!')
    await capture(page, '10-dashboard-dosen.png', 'Dashboard dosen')
  } catch (err) {
    log(`✗ 10-dashboard-dosen.png — ${err.message}`)
    results.failed.push({ filename: '10-dashboard-dosen.png', reason: err.message })
  }

  // 11 — Review form (dosen as penguji)
  try {
    await page.goto(`${BASE_URL}/proposals`, { waitUntil: 'networkidle' })
    const links = page.locator('a[href*="/proposals/"]')
    if (await links.count() > 0) {
      const href = await links.first().getAttribute('href')
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' })
      // Check if review form is present
      const reviewForm = page.locator('form:has(button:has-text("Kirim Review"))')
      if (await reviewForm.count() > 0) {
        // Fill sample scores
        const stars = page.locator('.lucide-star').filter({ hasText: '' })
        // Click 4th star of each criterion
        const starBtns = page.locator('button:has(.lucide-star)')
        const count = await starBtns.count()
        const scores = [4, 4, 5, 4]
        let criterionIdx = 0
        let starIdx = 0
        for (let i = 0; i < Math.min(count, 20); i++) {
          if (starIdx >= scores[criterionIdx]) {
            criterionIdx++
            starIdx = 0
            if (criterionIdx >= scores.length) break
          }
          if (starIdx === scores[criterionIdx] - 1) {
            try { await starBtns.nth(criterionIdx * 5 + scores[criterionIdx] - 1).click() } catch { /* ignore */ }
          }
          starIdx++
        }
        const textarea = page.locator('textarea[name="comments"], textarea[placeholder*="komentar" i]')
        if (await textarea.count() > 0) {
          await textarea.first().fill('Proposal ini memiliki metodologi yang kuat dan topik yang sangat relevan dengan kebutuhan industri pertanian Indonesia. Disarankan untuk memperjelas ruang lingkup dataset yang akan digunakan.')
        }
      }
    }
    await capture(page, '11-review-form.png', 'Form review dosen penguji')
  } catch (err) {
    log(`✗ 11-review-form.png — ${err.message}`)
    results.failed.push({ filename: '11-review-form.png', reason: err.message })
  }

  // 12 — Notifications
  try {
    await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle' })
    await capture(page, '12-notifications.png', 'Halaman notifikasi')
  } catch (err) {
    log(`✗ 12-notifications.png — ${err.message}`)
    results.failed.push({ filename: '12-notifications.png', reason: err.message })
  }

  // 13 — User Management (admin)
  try {
    await logout(page)
    await loginAs(page, 'admin@wilmar.ac.id', 'Admin123!')
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' })
    await capture(page, '13-user-management.png', 'Manajemen pengguna admin')
  } catch (err) {
    log(`✗ 13-user-management.png — ${err.message}`)
    results.failed.push({ filename: '13-user-management.png', reason: err.message })
  }

  await browser.close()

  console.log('\n=== HASIL SCREENSHOT ===')
  console.log(`✓ Berhasil: ${results.success.length}`)
  results.success.forEach(f => console.log(`  - ${f}`))
  if (results.failed.length > 0) {
    console.log(`✗ Gagal/Skip: ${results.failed.length}`)
    results.failed.forEach(f => console.log(`  - ${f.filename}: ${f.reason}`))
  }
  console.log(`\nFile disimpan di: screenshots/`)
})()
