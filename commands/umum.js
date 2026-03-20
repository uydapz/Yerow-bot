// commands/umum.js — Perintah umum

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  ping: async (sock, from) => {
    const start = Date.now();
    await sock.sendMessage(from, { text: "🏓 Mengukur..." });
    const ms = Date.now() - start;
    await sock.sendMessage(from, {
      text: `🏓 *Pong!* Bot aktif.\n⚡ Latency: ${ms}ms`,
    });
  },

  // !help & !help → sama-sama panggil ini
  help: async (sock, from) => {
    const imagePath = path.join(__dirname, "../assets/YEROW.jpg");

    const caption =
      `╔════════════════════════╗\n` +
      `                 ✨ *YEROW's BOT* ✨                        \n` +
      `                    _Command List v1.0_                          \n` +
      `               📦 Total: *100 commands*                     \n` +
      `╚════════════════════════╝\n\n` +
      `┌────────────────────────┐\n` +
      `  🐾 *UMUM* _(9 cmd)_                    \n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!ping\` — Cek kecepatan bot\n` +
      `  ✦ \`!help\` — Menu ini\n` +
      `  ✦ \`!info\` — Info grup\n` +
      `  ✦ \`!grupid\` — ID grup ini\n` +
      `  ✦ \`!waktu\` — Jam & tanggal sekarang\n` +
      `  ✦ \`!hitung [expr]\` — Kalkulator\n` +
      `  ✦ \`!quote\` — Quote motivasi random\n` +
      `  ✦ \`!fakta\` — Fakta unik random\n` +
      `  ✦ \`!jadwal\` — Jadwal otomatis bot\n\n` +
      `┌────────────────────────┐\n` +
      `  ✅ *ABSEN* _(5 cmd)_   \n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!absen\` — Absen hari ini\n` +
      `  ✦ \`!absen [ket]\` — Absen + keterangan\n` +
      `  ✦ \`!lihatAbsen\` — Rekap absen hari ini\n` +
      `  ✦ \`!lihatAbsen [tgl]\` — Absen tgl tertentu\n` +
      `  ✦ \`!rekapAbsen\` — Rekap absen minggu ini\n\n` +
      `┌────────────────────────┐\n` +
      `  👥 *MEMBER* _(3 cmd)_ \n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!listMember\` — Daftar semua member\n` +
      `  ✦ \`!profil\` — Profil kamu di grup\n` +
      `  ✦ \`!profil @member\` — Profil member lain\n\n` +
      `┌────────────────────────┐\n` +
      `  ⚙️ *TOOLS* _(12 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!eye\` — Buka gambar view once\n` +
      `  ✦ \`!sticker\` — Gambar → sticker\n` +
      `  ✦ \`!hd\` — Upscale 2x (file/no kompres)\n` +
      `  ✦ \`!hd 4\` — Upscale 4x lebih detail\n` +
      `  ✦ \`!ytmp3 [url]\` — Download audio YT\n` +
      `  ✦ \`!ytmp4 [url]\` — Download video YT\n` +
      `  ✦ \`!tiktok [url]\` — Download TikTok no WM\n` +
      `  ✦ \`!igdl [url]\` — Download Instagram\n` +
      `  ✦ \`!toaudio\` — Video → audio\n` +
      `  ✦ \`!tts [teks]\` — Text to speech\n` +
      `  ✦ \`!quotely [teks]\` — Buat gambar quote\n` +
      `  ✦ \`!squote [teks]\` — Buat sticker meme\n\n` +
      `┌────────────────────────┐\n` +
      ` 🛠️ *EXTRA TOOLS* _(17 cmd)_                                 \n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!translate [lang] [teks]\` — Terjemahkan\n` +
      `  ✦ \`!cuaca [kota]\` — Info cuaca\n` +
      `  ✦ \`!kamus [kata]\` — Arti kata\n` +
      `  ✦ \`!qr [teks]\` — Buat QR code\n` +
      `  ✦ \`!bmi [berat] [tinggi]\` — Hitung BMI\n` +
      `  ✦ \`!kurs [mata uang]\` — Kurs ke IDR\n` +
      `  ✦ \`!shortlink [url]\` — Perpendek URL\n` +
      `  ✦ \`!ip [alamat]\` — Info IP\n` +
      `  ✦ \`!password [panjang]\` — Generate password\n` +
      `  ✦ \`!meme\` — Meme random\n` +
      `  ✦ \`!motivasi\` — Motivasi random\n` +
      `  ✦ \`!ascii [teks]\` — ASCII art\n` +
      `  ✦ \`!random [min] [max]\` — Angka acak\n` +
      `  ✦ \`!siapa [pertanyaan]\` — Pilih member acak\n` +
      `  ✦ \`!tagadmin\` — Tag semua admin\n` +
      `  ✦ \`!tagme\` — Bot tag kamu\n` +
      `  ✦ \`!countmember\` — Hitung member\n\n` +
      `┌────────────────────────┐\n` +
      `  ✨ *HIBURAN* _(14 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!wiki [topik]\` — Info Wikipedia\n` +
      `  ✦ \`!pantun\` — Pantun random\n` +
      `  ✦ \`!horoscope [zodiak]\` — Ramalan harian\n` +
      `  ✦ \`!suhu [angka] [C/F/K]\` — Konversi suhu\n` +
      `  ✦ \`!timer [menit] [pesan]\` — Countdown\n` +
      `  ✦ \`!trivia\` — Kuis trivia (30 detik)\n` +
      `  ✦ \`!resep [makanan]\` — Resep masakan\n` +
      `  ✦ \`!tebakkata\` — Game tebak kata\n` +
      `  ✦ \`!namabayi [L/P]\` — Ide nama bayi\n` +
      `  ✦ \`!cerita\` — Cerita pendek random\n` +
      `  ✦ \`!jadwalSholat [kota]\` — Jadwal sholat\n` +
      `  ✦ \`!gpt [pertanyaan]\` — Tanya AI\n` +
      `  ✦ \`!hangman\` — Game hangman\n` +
      `  ✦ \`!kata [huruf]\` — Kata acak dari huruf\n\n` +
      `┌────────────────────────┐\n` +
      `🎮 *GAME & FUN* _(9 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!tebakAngka\` — Main tebak angka\n` +
      `  ✦ \`!tebak [angka]\` — Jawab tebakan\n` +
      `  ✦ \`!suit [b/k/g]\` — Main suit vs bot\n` +
      `  ✦ \`!dadu\` — Lempar dadu\n` +
      `  ✦ \`!koin\` — Lempar koin\n` +
      `  ✦ \`!pilih [a/b/c]\` — Bot pilihkan\n` +
      `  ✦ \`!acak @a @b\` — Acak dari mention\n` +
      `  ✦ \`!8ball [pertanyaan]\` — Ramalan\n` +
      `  ✦ \`!zodiak [zodiak]\` — Info zodiak\n\n` +
      `┌────────────────────────┐\n` +
      `📊 *POLLING* _(4 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!poll [pertanyaan]\` — Buat polling\n` +
      `  ✦ \`!vote [ya/tidak/abstain]\` — Vote\n` +
      `  ✦ \`!hasilPoll\` — Hasil polling\n` +
      `  ✦ \`!tutupPoll\` — Tutup polling\n\n` +
      `┌────────────────────────┐\n` +
      `📝 *CATATAN* _(9 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!catat [judul] | [isi]\` — Simpan\n` +
      `  ✦ \`!lihatCatatan\` — Daftar catatan\n` +
      `  ✦ \`!bacaCatatan [judul]\` — Baca\n` +
      `  ✦ \`!hapusCatatan [judul]\` — Hapus\n` +
      `  ✦ \`!list [nama]\` — Lihat list\n` +
      `  ✦ \`!addlist [nama]\` — Tambah list\n` +
      `  ✦ \`!dellist [nama]\` — Hapus list\n` +
      `  ✦ \`!resetlist [nama]\` — Reset list\n` +
      `  ✦ \`!updatelist [nama] [no] [baru]\`\n\n` +
      `┌────────────────────────┐\n` +
      `🛡️ *ADMIN* _(9 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!kick @member\` — Kick member\n` +
      `  ✦ \`!warn @member [alasan]\` — Warn\n` +
      `  ✦ \`!cekWarn @member\` — Cek warn\n` +
      `  ✦ \`!resetWarn @member\` — Reset warn\n` +
      `  ✦ \`!mute\` — Kunci grup\n` +
      `  ✦ \`!unmute\` — Buka kunci grup\n` +
      `  ✦ \`!tagAll [pesan]\` — Tag semua\n` +
      `  ✦ \`!pengumuman [teks]\` — Pengumuman\n` +
      `  ✦ \`!ingatkan [menit] [pesan]\` — Timer\n\n` +
      `┌────────────────────────┐\n` +
      `🚫 *ANTI* _(7 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!antiLink on/off\` — Anti link\n` +
      `  ✦ \`!antiStory on/off\` — Anti story\n` +
      `  ✦ \`!antiBadwords on/off\` — Anti kasar\n` +
      `  ✦ \`!tambahBadword [kata]\` — Tambah\n` +
      `  ✦ \`!hapusBadword [kata]\` — Hapus\n` +
      `  ✦ \`!daftarBadword\` — Lihat daftar\n` +
      `  ✦ \`!cekAnti\` — Status fitur anti\n\n` +
      `┌────────────────────────┐\n` +
      `⭐ *PREMIUM* _(2 cmd)_\n` +
      `└────────────────────────┘\n` +
      `  ✦ \`!infoBot\` — Status lisensi grup\n` +
      `  ✦ \`!aktif [durasi] [satuan]\` — Aktivasi*\n\n` +
      `╔════════════════════════╗\n` +
      `  _*) Hanya owner bot_\n` +
      `  *『 Yerow's Bot 』v1.0*\n` +
      `╚════════════════════════╝`;

    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      await sock.sendMessage(from, { image: imageBuffer, caption });
    } else {
      await sock.sendMessage(from, { text: caption });
    }
  },

  info: async (sock, from) => {
    try {
      const meta = await sock.groupMetadata(from);
      const adminList = meta.participants
        .filter((p) => p.admin)
        .map((p) => `  • @${p.id.split("@")[0]}`)
        .join("\n");
      await sock.sendMessage(from, {
        text:
          `📋 *INFO GRUP*\n\n` +
          `📛 Nama: ${meta.subject}\n` +
          `👥 Member: ${meta.participants.length} orang\n` +
          `📅 Dibuat: ${new Date(meta.creation * 1000).toLocaleDateString("id-ID")}\n` +
          `📝 Deskripsi:\n${meta.desc || "_Tidak ada deskripsi_"}\n\n` +
          `🛡️ Admin:\n${adminList}`,
        mentions: meta.participants.filter((p) => p.admin).map((p) => p.id),
      });
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil info grup." });
    }
  },

  grupid: async (sock, from) => {
    await sock.sendMessage(from, {
      text: `🆔 *ID Grup Ini:*\n\n\`${from}\``,
    });
  },

  waktu: async (sock, from) => {
    const now = new Date();
    const jam = now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });
    const tgl = now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta",
    });
    await sock.sendMessage(from, {
      text: `🕐 *Waktu Sekarang (WIB)*\n\n📅 ${tgl}\n⏰ ${jam}`,
    });
  },

  hitung: async (sock, from, args) => {
    const ekspresi = args.join(" ").replace(/[^0-9+\-*/().% ]/g, "");
    if (!ekspresi) {
      await sock.sendMessage(from, { text: "❌ Format: !hitung 10 + 5 * 2" });
      return;
    }
    try {
      const hasil = Function(`"use strict"; return (${ekspresi})`)();
      await sock.sendMessage(from, {
        text: `🧮 *Kalkulator*\n\n${ekspresi} = *${hasil}*`,
      });
    } catch {
      await sock.sendMessage(from, { text: "❌ Ekspresi tidak valid." });
    }
  },

  quote: async (sock, from) => {
    const quotes = [
      {
        teks: "Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.",
        author: "Colin Powell",
      },
      {
        teks: "Jangan hitung harinya, buat setiap hari berharga.",
        author: "Muhammad Ali",
      },
      {
        teks: "Orang yang berhenti belajar akan menjadi tua, baik di usia 20 maupun 80.",
        author: "Henry Ford",
      },
      {
        teks: "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu bereaksi.",
        author: "Charles Swindoll",
      },
      {
        teks: "Percayalah kamu bisa dan kamu sudah setengah jalan.",
        author: "Theodore Roosevelt",
      },
      {
        teks: "Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah mencintai apa yang kamu lakukan.",
        author: "Steve Jobs",
      },
      {
        teks: "Jangan takut gagal. Takutlah untuk tidak mencoba.",
        author: "Roy T. Bennett",
      },
      {
        teks: "Mulailah dari mana kamu berada. Gunakan apa yang kamu punya. Lakukan apa yang kamu bisa.",
        author: "Arthur Ashe",
      },
      {
        teks: "Impian tidak bekerja kecuali kamu melakukannya.",
        author: "John C. Maxwell",
      },
      {
        teks: "Keberhasilan bukan milik orang yang pintar, tapi milik mereka yang konsisten.",
        author: "Anonim",
      },
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    await sock.sendMessage(from, {
      text: `💬 *Quote of the Day*\n\n_"${q.teks}"_\n\n— *${q.author}*`,
    });
  },

  fakta: async (sock, from) => {
    const faktas = [
      "Lebah madu mengepakkan sayapnya sekitar 200 kali per detik.",
      "Sidik jari koala sangat mirip manusia sampai bisa mengecoh polisi.",
      "Gurita punya tiga jantung dan darah berwarna biru.",
      "Satu hari di Venus lebih panjang dari satu tahun di Venus.",
      "Pisang secara teknis adalah buah beri, tapi stroberi bukan.",
      "Air panas bisa membeku lebih cepat dari air dingin (Efek Mpemba).",
      "Manusia adalah satu-satunya hewan yang bisa memerah mukanya.",
      "Semut tidak pernah tidur selama hidupnya.",
      "Semua beruang kutub kidal.",
      "Lidah bunglon panjangnya bisa 2x panjang tubuhnya.",
      "Hiu lebih tua dari pohon. Hiu sudah ada 450 juta tahun lalu.",
      "Coklat bisa membunuh anjing karena mengandung theobromine.",
    ];
    const f = faktas[Math.floor(Math.random() * faktas.length)];
    await sock.sendMessage(from, { text: `💡 *Fakta Unik*\n\n${f}` });
  },

  jadwal: async (sock, from) => {
    await sock.sendMessage(from, {
      text:
        `⏰ *Jadwal Otomatis Bot*\n\n` +
        `🌅 07.00 — Pengingat pagi + absen\n` +
        `☀️ 12.00 — Pengingat siang\n` +
        `🌙 20.00 — Pengingat malam\n` +
        `📊 21.00 — Rekap absen harian\n\n` +
        `📅 *Mingguan:*\n` +
        `📌 Senin 08.00 — Semangat minggu baru\n` +
        `🎉 Jumat 16.00 — Selamat akhir pekan`,
    });
  },
};
