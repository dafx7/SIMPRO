const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const BASE_URL = 'http://localhost:3000'
const RECORDINGS_DIR = path.join(__dirname, '..', 'demo-recordings')

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

async function pause(page, ms = 1500) {
  await page.waitForTimeout(ms)
}

async function loginAs(page, email, password, description) {
  log(`Login sebagai ${description}...`)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await pause(page, 1000)
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', email)
  await page.fill('input[type="password"], input[name="password"]', password)
  await pause(page, 800)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|proposals|admin)/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)
}

async function logout(page) {
  log('Logout...')
  try {
    const logoutBtn = page.locator('button:has-text("Keluar"), a:has-text("Keluar"), button:has-text("Logout")')
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click()
    } else {
      await page.goto(`${BASE_URL}/api/auth/signout`)
      const btn = page.locator('button[type="submit"]')
      if (await btn.count() > 0) await btn.click()
    }
    await page.waitForTimeout(2000)
  } catch {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForTimeout(1000)
  }
}

;(async () => {
  if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true })

  log('Memulai perekaman demo SIMPRO...')

  const browser = await chromium.launch({ headless: false }) // headed for better recording
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1280, height: 720 },
    },
  })
  const page = await context.newPage()

  const steps = []
  function step(name) {
    log(`▶ Step: ${name}`)
    steps.push({ name, time: Date.now() })
  }

  try {
    // STEP 1: Login page
    step('01 — Buka halaman login')
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await pause(page, 2000)

    // STEP 2: Login sebagai mahasiswa
    step('02 — Login sebagai Mahasiswa')
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'mhs1@wilmar.ac.id')
    await pause(page, 600)
    await page.fill('input[type="password"], input[name="password"]', 'Mahasiswa123!')
    await pause(page, 600)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|proposals)/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await pause(page, 2000)

    // STEP 3: Klik Ajukan Proposal Baru
    step('03 — Klik Ajukan Proposal Baru')
    const newProposalBtn = page.locator('a[href="/proposals/new"], button:has-text("Ajukan Proposal"), a:has-text("Proposal Baru")')
    if (await newProposalBtn.count() > 0) {
      await newProposalBtn.first().click()
      await page.waitForLoadState('networkidle')
    } else {
      await page.goto(`${BASE_URL}/proposals/new`, { waitUntil: 'networkidle' })
    }
    await pause(page, 1500)

    // STEP 4: Isi judul dan abstrak
    step('04 — Isi form proposal step 1')
    const titleInput = page.locator('input[name="title"], input[placeholder*="judul" i]').first()
    await titleInput.click()
    await pause(page, 400)
    await titleInput.fill('Sistem Deteksi Hama Tanaman Menggunakan Computer Vision')
    await pause(page, 1000)

    const abstractInput = page.locator('textarea[name="abstract"], textarea[placeholder*="abstrak" i]').first()
    await abstractInput.click()
    await pause(page, 400)
    await abstractInput.fill('Penelitian ini mengusulkan pengembangan sistem cerdas berbasis computer vision dan deep learning untuk mendeteksi hama tanaman padi secara otomatis di lahan pertanian Indonesia, guna meningkatkan produktivitas petani dan mengurangi kerugian akibat hama.')
    await pause(page, 1500)

    // STEP 5: Next ke step 2
    step('05 — Lanjut ke step 2')
    const nextBtn = page.locator('button:has-text("Lanjut"), button:has-text("Next"), button:has-text("Berikutnya")')
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click()
      await pause(page, 1500)
    }

    // STEP 6: Step 2 — upload file (skip if no dummy pdf)
    step('06 — Step 2 (upload dokumen)')
    const dummyPdf = path.join(__dirname, '..', 'public', 'sample.pdf')
    const fileInput = page.locator('input[type="file"]')
    if (fs.existsSync(dummyPdf) && await fileInput.count() > 0) {
      await fileInput.setInputFiles(dummyPdf)
      await pause(page, 1000)
    }
    await pause(page, 1500)

    // STEP 7: Next ke step 3 dan submit
    step('07 — Lanjut ke step 3 dan submit')
    const nextBtn2 = page.locator('button:has-text("Lanjut"), button:has-text("Next"), button:has-text("Berikutnya")')
    if (await nextBtn2.count() > 0) {
      await nextBtn2.first().click()
      await pause(page, 1000)
    }
    const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Kirim Proposal"), button[type="submit"]')
    if (await submitBtn.count() > 0) {
      await submitBtn.last().click()
      await page.waitForTimeout(3000)
    }
    await pause(page, 2000)

    // STEP 8: Logout, login admin
    step('08 — Logout dan login sebagai Admin')
    await logout(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await pause(page, 1000)
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'admin@wilmar.ac.id')
    await pause(page, 500)
    await page.fill('input[type="password"], input[name="password"]', 'Admin123!')
    await pause(page, 500)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await pause(page, 2000)

    // STEP 9: Navigasi ke proposal, buka detail
    step('09 — Navigasi ke detail proposal')
    await page.goto(`${BASE_URL}/admin/proposals`, { waitUntil: 'networkidle' })
    await pause(page, 1000)
    const proposalLinks = page.locator('a[href*="/proposals/"]')
    if (await proposalLinks.count() > 0) {
      const href = await proposalLinks.first().getAttribute('href')
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' })
      await pause(page, 2000)
    }

    // STEP 10: Tugaskan Pembimbing
    step('10 — Tugaskan Pembimbing')
    const pembimbingBtn = page.locator('button:has-text("Tugaskan Pembimbing"), button:has-text("Pembimbing")')
    if (await pembimbingBtn.count() > 0) {
      await pembimbingBtn.first().click()
      await pause(page, 1500)
      // Select first dosen
      const dosenSelect = page.locator('[role="listbox"] [role="option"], select option')
      if (await dosenSelect.count() > 0) {
        await dosenSelect.first().click()
        await pause(page, 800)
      }
      const confirmBtn = page.locator('button:has-text("Simpan"), button:has-text("Konfirmasi"), button:has-text("Tugaskan")')
      if (await confirmBtn.count() > 0) {
        await confirmBtn.last().click()
        await page.waitForTimeout(2000)
      }
      await pause(page, 1500)
    }

    // STEP 11: Tugaskan Penguji dengan AI
    step('11 — Tugaskan Penguji (AI recommendation)')
    const pengujiBtn = page.locator('button:has-text("Tugaskan Penguji"), button:has-text("Penguji")')
    if (await pengujiBtn.count() > 0) {
      await pengujiBtn.first().click()
      await pause(page, 3500) // Wait for AI to load
      // Select top recommended
      const dosenOption = page.locator('[role="listbox"] [role="option"], input[type="checkbox"]')
      if (await dosenOption.count() > 0) {
        await dosenOption.first().click()
        await pause(page, 800)
      }
      const confirmBtn2 = page.locator('button:has-text("Simpan"), button:has-text("Konfirmasi"), button:has-text("Tugaskan")')
      if (await confirmBtn2.count() > 0) {
        await confirmBtn2.last().click()
        await page.waitForTimeout(2000)
      }
      await pause(page, 2000)
    }

    // STEP 12: Login dosen
    step('12 — Login sebagai Dosen Penguji')
    await logout(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await pause(page, 1000)
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'dosen1@wilmar.ac.id')
    await pause(page, 500)
    await page.fill('input[type="password"], input[name="password"]', 'Dosen123!')
    await pause(page, 500)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|proposals)/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await pause(page, 2000)

    // STEP 13: Buka proposal yang di-assign, isi review
    step('13 — Isi form review')
    await page.goto(`${BASE_URL}/proposals`, { waitUntil: 'networkidle' })
    await pause(page, 1000)
    const proposalLinks2 = page.locator('a[href*="/proposals/"]')
    if (await proposalLinks2.count() > 0) {
      const href = await proposalLinks2.first().getAttribute('href')
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' })
      await pause(page, 1500)

      // Fill review form if visible
      const starBtns = page.locator('button:has(.lucide-star)')
      const scores = [4, 4, 5, 4]
      for (let i = 0; i < scores.length; i++) {
        const targetStar = page.locator('button:has(.lucide-star)').nth(i * 5 + scores[i] - 1)
        try {
          await targetStar.click()
          await pause(page, 400)
        } catch { /* skip */ }
      }

      const textarea = page.locator('textarea[name="comments"], textarea[placeholder*="komentar" i]')
      if (await textarea.count() > 0) {
        await textarea.first().fill('Proposal ini memiliki metodologi yang kuat dan topik yang sangat relevan dengan kebutuhan industri. Disarankan untuk memperjelas ruang lingkup dataset yang akan digunakan dalam penelitian.')
        await pause(page, 1000)
      }

      const approveLabel = page.locator('label:has(input[value="APPROVE"])')
      if (await approveLabel.count() > 0) {
        await approveLabel.click()
        await pause(page, 800)
      }

      const submitReview = page.locator('button:has-text("Kirim Review")')
      if (await submitReview.count() > 0) {
        await submitReview.click()
        await page.waitForTimeout(2500)
      }
      await pause(page, 2000)
    }

    // STEP 14: Login admin lagi
    step('14 — Login Admin untuk buat keputusan')
    await logout(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await pause(page, 1000)
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'admin@wilmar.ac.id')
    await pause(page, 500)
    await page.fill('input[type="password"], input[name="password"]', 'Admin123!')
    await pause(page, 500)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await pause(page, 2000)

    // STEP 15: Buka proposal, buat keputusan APPROVED
    step('15 — Buat keputusan Setujui')
    await page.goto(`${BASE_URL}/admin/proposals`, { waitUntil: 'networkidle' })
    await pause(page, 1000)
    const proposalLinks3 = page.locator('a[href*="/proposals/"]')
    if (await proposalLinks3.count() > 0) {
      const href = await proposalLinks3.first().getAttribute('href')
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' })
      await pause(page, 1500)

      const decisionBtn = page.locator('button:has-text("Buat Keputusan"), button:has-text("Keputusan")')
      if (await decisionBtn.count() > 0) {
        await decisionBtn.first().click()
        await pause(page, 1500)

        const approveOpt = page.locator('label:has(input[value="APPROVED"]), button:has-text("Setujui")')
        if (await approveOpt.count() > 0) {
          await approveOpt.first().click()
          await pause(page, 800)
        }

        const noteInput = page.locator('textarea[name="adminNotes"], textarea[placeholder*="catatan" i]')
        if (await noteInput.count() > 0) {
          await noteInput.fill('Proposal disetujui. Penelitian dapat dilanjutkan ke tahap berikutnya.')
          await pause(page, 800)
        }

        const confirmDecision = page.locator('button:has-text("Konfirmasi"), button:has-text("Simpan"), button[type="submit"]')
        if (await confirmDecision.count() > 0) {
          await confirmDecision.last().click()
          await page.waitForTimeout(3000)
        }
      }
    }

    // STEP 16: Final — lihat status APPROVED
    step('16 — Tampilkan status final APPROVED')
    await page.waitForLoadState('networkidle')
    await pause(page, 3000)

    log('✓ Demo recording selesai!')

  } catch (err) {
    log(`✗ Error saat recording: ${err.message}`)
    console.error(err)
  }

  await page.waitForTimeout(1000)
  await context.close()
  await browser.close()

  // Find the generated video
  const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.webm'))
  if (files.length > 0) {
    const rawVideo = path.join(RECORDINGS_DIR, files[0])
    const finalVideo = path.join(RECORDINGS_DIR, 'simpro-demo-raw.webm')
    if (rawVideo !== finalVideo) fs.renameSync(rawVideo, finalVideo)
    log(`Video disimpan: demo-recordings/simpro-demo-raw.webm`)

    // Try ffmpeg conversion
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' })
      log('Mengkonversi ke MP4...')
      execSync(`ffmpeg -i "${finalVideo}" -c:v libx264 -crf 23 "${path.join(RECORDINGS_DIR, 'simpro-demo.mp4')}" -y`, { stdio: 'inherit' })
      log('✓ Video MP4: demo-recordings/simpro-demo.mp4')
    } catch {
      log('⚠ ffmpeg tidak tersedia. File .webm siap di demo-recordings/simpro-demo-raw.webm')
      log('  → YouTube dan Google Drive menerima format .webm langsung')
    }
  } else {
    log('⚠ Tidak ada file video yang dihasilkan')
  }

  console.log('\nSteps yang direkam:')
  steps.forEach((s, i) => {
    const dur = i < steps.length - 1 ? ((steps[i+1].time - s.time) / 1000).toFixed(1) + 's' : 'end'
    console.log(`  ${s.name} (${dur})`)
  })
})()
