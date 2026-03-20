// config.js — pengaturan bot

export const config = {
  // Prefix perintah
  prefix: "!",

  // Nama bot
  namaBott: "Yerow",

  // Nomor HP owner bot (tanpa + dan tanpa @s.whatsapp.net)
  // Contoh: '6281234567890'
  ownerNumber: "71829217652802",

  // ID Grup target (isi setelah bot nyala, lihat di console)
  // Format: "628xxx@g.us"
  // Kosongkan ('') agar bot aktif di semua grup
  grupId: "",

  // Kata kunci yang direspons (tanpa prefix)
  keywords: {
    halo: "Halo juga! 👋 Ada yang bisa dibantu?",
    hai: "Hai! 😊 Ketik !help untuk melihat daftar perintah.",
    "selamat pagi": "🌅 Selamat pagi! Semoga harimu menyenangkan!",
    "selamat siang": "☀️ Selamat siang! Jangan lupa makan ya!",
    "selamat malam": "🌙 Selamat malam! Istirahat yang cukup ya!",
    Yerow: "Oyy, gw ada bos. ketik aja !help kalo gatau mau ngapain.",
  },

  // Link yang diperbolehkan (whitelist)
  linkDiizinkan: ["wa.me", "whatsapp.com"],

  // ── Fitur Anti (bisa di-toggle lewat command !antiLink on/off dll) ──
  antiLink: false, // Anti link otomatis
  antiStory: false, // Anti forward story/status
  antiBadwords: false, // Anti kata kasar

  // Kata kasar tambahan (selain default)
  customBadwords: [],

  // Jadwal reminder harian (format cron: 'menit jam * * *')
  jadwalHarian: {
    pagi: {
      cron: "0 7 * * *",
      pesan: "🌅 *Selamat Pagi Semua!*\nJangan lupa absen dengan !absen ya! 📋",
    },
    siang: {
      cron: "0 12 * * *",
      pesan: "☀️ *Pengingat Siang!*\nSudah makan siang belum? 🍱",
    },
    malam: {
      cron: "0 20 * * *",
      pesan:
        "🌙 *Selamat Malam!*\nRingkasan absen hari ini akan segera dikirim.",
    },
  },

  // Jadwal reminder mingguan (format cron: 'menit jam * * hariKe-0=minggu')
  jadwalMingguan: {
    senin: {
      cron: "0 8 * * 1",
      pesan:
        "📅 *Selamat Minggu Baru!*\nSemangat menjalani hari-hari ke depan! 💪",
    },
    jumat: {
      cron: "0 16 * * 5",
      pesan:
        "🎉 *Selamat Akhir Pekan!*\nJangan lupa rekap kegiatan minggu ini.",
    },
  },
};
