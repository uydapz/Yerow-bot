// commands/game.js — Fitur game & hiburan

// Simpan state game tebak angka per grup
const tebakState = new Map(); // { grupJid: { angka, pemain } }

export default {

  tebakAngka: async (sock, from, args, pengirimJid) => {
    if (tebakState.has(from)) {
      await sock.sendMessage(from, { text: '⚠️ Sudah ada game tebak angka yang berjalan!\nKetik *!tebak [angka]* untuk menebak.' });
      return;
    }
    const angka = Math.floor(Math.random() * 100) + 1;
    tebakState.set(from, { angka, percobaan: 0, maxPercobaan: 7, pemain: pengirimJid });
    await sock.sendMessage(from, {
      text:
        `🎮 *TEBAK ANGKA DIMULAI!*\n\n` +
        `Saya memikirkan angka antara *1 - 100*\n` +
        `Kamu punya *7 kesempatan* untuk menebak!\n\n` +
        `Ketik: *!tebak [angka]*\nContoh: !tebak 50`,
    });
  },

  tebak: async (sock, from, args, pengirimJid) => {
    const state = tebakState.get(from);
    if (!state) {
      await sock.sendMessage(from, { text: '❌ Tidak ada game yang berjalan. Ketik *!tebakAngka* untuk mulai.' });
      return;
    }
    const tebakan = parseInt(args[0]);
    if (isNaN(tebakan) || tebakan < 1 || tebakan > 100) {
      await sock.sendMessage(from, { text: '❌ Masukkan angka antara 1-100.\nContoh: !tebak 50' });
      return;
    }
    state.percobaan++;
    const sisa = state.maxPercobaan - state.percobaan;

    if (tebakan === state.angka) {
      tebakState.delete(from);
      await sock.sendMessage(from, {
        text:
          `🎉 *SELAMAT @${pengirimJid.split('@')[0]}!*\n\n` +
          `Tebakan kamu *${tebakan}* BENAR! 🎯\n` +
          `Dicapai dalam *${state.percobaan} percobaan*!`,
        mentions: [pengirimJid],
      });
    } else if (state.percobaan >= state.maxPercobaan) {
      tebakState.delete(from);
      await sock.sendMessage(from, {
        text: `😢 Game Over! Kesempatan habis.\nJawaban yang benar: *${state.angka}*`,
      });
    } else {
      const hint = tebakan < state.angka ? '📈 Terlalu kecil!' : '📉 Terlalu besar!';
      await sock.sendMessage(from, {
        text: `${hint}\nTebakan: *${tebakan}*\nSisa kesempatan: *${sisa}*`,
      });
    }
  },

  suit: async (sock, from, args, pengirimJid) => {
    const pilihan = ['🪨 Batu', '📄 Kertas', '✂️ Gunting'];
    const pilihanUser = args[0]?.toLowerCase();
    const map = { batu: 0, kertas: 1, gunting: 2, b: 0, k: 1, g: 2 };

    if (pilihanUser === undefined || !(pilihanUser in map)) {
      await sock.sendMessage(from, {
        text: `🎮 *SUIT*\nKetik: *!suit [batu/kertas/gunting]*\nContoh: !suit batu`,
      });
      return;
    }

    const indexUser = map[pilihanUser];
    const indexBot = Math.floor(Math.random() * 3);
    const namaUser = pilihan[indexUser];
    const namaBot = pilihan[indexBot];

    let hasil;
    if (indexUser === indexBot) hasil = '🤝 *SERI!*';
    else if ((indexUser - indexBot + 3) % 3 === 1) hasil = `🎉 *KAMU MENANG!*`;
    else hasil = `🤖 *BOT MENANG!*`;

    await sock.sendMessage(from, {
      text:
        `✊ *SUIT!*\n\n` +
        `👤 Kamu: ${namaUser}\n` +
        `🤖 Bot: ${namaBot}\n\n` +
        hasil,
    });
  },

  dadu: async (sock, from) => {
    const hasil = Math.floor(Math.random() * 6) + 1;
    const emoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    await sock.sendMessage(from, {
      text: `🎲 *Lempar Dadu!*\n\nHasil: ${emoji[hasil - 1]} *${hasil}*`,
    });
  },

  koin: async (sock, from) => {
    const hasil = Math.random() < 0.5 ? '🪙 *HEADS* (Angka)' : '🪙 *TAILS* (Gambar)';
    await sock.sendMessage(from, { text: `🪙 *Lempar Koin!*\n\nHasil: ${hasil}` });
  },

  pilih: async (sock, from, args) => {
    if (args.length < 2) {
      await sock.sendMessage(from, { text: '❌ Minimal 2 pilihan!\nContoh: !pilih makan/tidur/main' });
      return;
    }
    const opsi = args.join(' ').split(/[\/,|]/).map(s => s.trim()).filter(Boolean);
    const terpilih = opsi[Math.floor(Math.random() * opsi.length)];
    await sock.sendMessage(from, {
      text: `🎯 *Pilihan Bot:*\n\n${opsi.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n➡️ Bot memilih: *${terpilih}*`,
    });
  },

  acak: async (sock, from, args, pengirimJid, mentionedJids) => {
    if (!mentionedJids || mentionedJids.length < 2) {
      await sock.sendMessage(from, { text: '❌ Tag minimal 2 orang!\nContoh: !acak @a @b @c' });
      return;
    }
    const terpilih = mentionedJids[Math.floor(Math.random() * mentionedJids.length)];
    await sock.sendMessage(from, {
      text: `🎰 *Pengacakan Selesai!*\n\nDari ${mentionedJids.length} orang, yang terpilih adalah:\n\n👉 @${terpilih.split('@')[0]}`,
      mentions: [terpilih],
    });
  },

  '8ball': async (sock, from, args) => {
    const pertanyaan = args.join(' ');
    if (!pertanyaan) {
      await sock.sendMessage(from, { text: '❌ Tulis pertanyaannya!\nContoh: !8ball Apakah saya beruntung hari ini?' });
      return;
    }
    const jawaban = [
      '✅ Ya, tentu saja!', '✅ Sangat mungkin!', '✅ Pasti!', '✅ Iya, percayalah.',
      '🤔 Mungkin...', '🤔 Tidak pasti.', '🤔 Coba lagi nanti.',
      '❌ Tidak.', '❌ Jangan harap.', '❌ Sangat tidak mungkin.', '❌ Hmm, sepertinya tidak.',
    ];
    const j = jawaban[Math.floor(Math.random() * jawaban.length)];
    await sock.sendMessage(from, {
      text: `🎱 *Magic 8-Ball*\n\n❓ ${pertanyaan}\n\n💬 ${j}`,
    });
  },

  zodiak: async (sock, from, args) => {
    const nama = args[0]?.toLowerCase();
    const data = {
      aries: { emoji: '♈', tgl: '21 Mar - 19 Apr', sifat: 'Berani, percaya diri, antusias, impulsif', keberuntungan: 'Merah, Selasa, Besi' },
      taurus: { emoji: '♉', tgl: '20 Apr - 20 Mei', sifat: 'Sabar, handal, setia, keras kepala', keberuntungan: 'Hijau, Jumat, Tembaga' },
      gemini: { emoji: '♊', tgl: '21 Mei - 20 Jun', sifat: 'Cerdas, adaptif, penasaran, tidak konsisten', keberuntungan: 'Kuning, Rabu, Merkuri' },
      cancer: { emoji: '♋', tgl: '21 Jun - 22 Jul', sifat: 'Intuitif, emosional, protektif, moody', keberuntungan: 'Putih, Senin, Perak' },
      leo: { emoji: '♌', tgl: '23 Jul - 22 Agt', sifat: 'Karismatik, murah hati, dominan, egois', keberuntungan: 'Emas, Minggu, Emas' },
      virgo: { emoji: '♍', tgl: '23 Agt - 22 Sep', sifat: 'Analitis, praktis, perfeksionis, pemalu', keberuntungan: 'Abu-abu, Rabu, Merkuri' },
      libra: { emoji: '♎', tgl: '23 Sep - 22 Okt', sifat: 'Adil, sosial, diplomatik, ragu-ragu', keberuntungan: 'Biru, Jumat, Tembaga' },
      scorpio: { emoji: '♏', tgl: '23 Okt - 21 Nov', sifat: 'Intens, setia, misterius, posesif', keberuntungan: 'Merah gelap, Selasa, Plutonium' },
      sagitarius: { emoji: '♐', tgl: '22 Nov - 21 Des', sifat: 'Optimis, bebas, petualang, tidak sabaran', keberuntungan: 'Ungu, Kamis, Timah' },
      capricorn: { emoji: '♑', tgl: '22 Des - 19 Jan', sifat: 'Ambisius, disiplin, bertanggung jawab, kaku', keberuntungan: 'Coklat, Sabtu, Timah' },
      aquarius: { emoji: '♒', tgl: '20 Jan - 18 Feb', sifat: 'Inovatif, idealis, bebas, dingin', keberuntungan: 'Biru langit, Sabtu, Uranus' },
      pisces: { emoji: '♓', tgl: '19 Feb - 20 Mar', sifat: 'Empatik, artistik, intuitif, mudah terpengaruh', keberuntungan: 'Hijau laut, Kamis, Neptun' },
    };

    if (!nama || !data[nama]) {
      const list = Object.keys(data).join(', ');
      await sock.sendMessage(from, { text: `❌ Zodiak tidak ditemukan.\nPilihan: ${list}\nContoh: !zodiak scorpio` });
      return;
    }

    const z = data[nama];
    await sock.sendMessage(from, {
      text:
        `${z.emoji} *${nama.charAt(0).toUpperCase() + nama.slice(1)}*\n\n` +
        `📅 Tanggal: ${z.tgl}\n` +
        `🧠 Sifat: ${z.sifat}\n` +
        `🍀 Keberuntungan: ${z.keberuntungan}`,
    });
  },

};