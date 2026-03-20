// commands/poll.js — Polling & Catatan Grup

// State polling per grup
const pollState = new Map(); // { grupJid: { pertanyaan, ya, tidak, voters } }
// Catatan per grup
const catatanMap = new Map(); // { grupJid: { judul: isi } }

export const pollCommands = {

  poll: async (sock, from, args, pengirimJid) => {
    if (pollState.has(from)) {
      await sock.sendMessage(from, { text: '⚠️ Sudah ada polling aktif!\nKetik *!hasilPoll* untuk melihat hasilnya.' });
      return;
    }
    const pertanyaan = args.join(' ');
    if (!pertanyaan) {
      await sock.sendMessage(from, { text: '❌ Tulis pertanyaan polling!\nContoh: !poll Apakah setuju meeting jam 9?' });
      return;
    }
    pollState.set(from, { pertanyaan, ya: 0, tidak: 0, abstain: 0, voters: new Set() });
    await sock.sendMessage(from, {
      text:
        `📊 *POLLING DIMULAI!*\n\n` +
        `❓ ${pertanyaan}\n\n` +
        `Ketik untuk vote:\n` +
        `✅ *!vote ya*\n` +
        `❌ *!vote tidak*\n` +
        `🤷 *!vote abstain*\n\n` +
        `Ketik *!hasilPoll* untuk melihat hasil sementara.`,
    });
  },

  vote: async (sock, from, args, pengirimJid) => {
    const state = pollState.get(from);
    if (!state) {
      await sock.sendMessage(from, { text: '❌ Tidak ada polling aktif. Ketik *!poll [pertanyaan]* untuk membuat polling.' });
      return;
    }
    if (state.voters.has(pengirimJid)) {
      await sock.sendMessage(from, {
        text: `ℹ️ @${pengirimJid.split('@')[0]}, kamu sudah vote sebelumnya.`,
        mentions: [pengirimJid],
      });
      return;
    }
    const pilihan = args[0]?.toLowerCase();
    if (!['ya', 'tidak', 'abstain'].includes(pilihan)) {
      await sock.sendMessage(from, { text: '❌ Pilihan tidak valid.\nGunakan: !vote ya / !vote tidak / !vote abstain' });
      return;
    }
    state.voters.add(pengirimJid);
    state[pilihan]++;
    await sock.sendMessage(from, {
      text: `✅ Vote *${pilihan.toUpperCase()}* dari @${pengirimJid.split('@')[0]} tercatat!`,
      mentions: [pengirimJid],
    });
  },

  hasilPoll: async (sock, from) => {
    const state = pollState.get(from);
    if (!state) {
      await sock.sendMessage(from, { text: '❌ Tidak ada polling aktif.' });
      return;
    }
    const total = state.ya + state.tidak + state.abstain;
    const pct = (n) => total === 0 ? 0 : Math.round((n / total) * 100);
    await sock.sendMessage(from, {
      text:
        `📊 *Hasil Polling Sementara*\n\n` +
        `❓ ${state.pertanyaan}\n\n` +
        `✅ Ya: ${state.ya} suara (${pct(state.ya)}%)\n` +
        `❌ Tidak: ${state.tidak} suara (${pct(state.tidak)}%)\n` +
        `🤷 Abstain: ${state.abstain} suara (${pct(state.abstain)}%)\n` +
        `─────────────────\n` +
        `👥 Total pemilih: ${total}`,
    });
  },

  tutupPoll: async (sock, from) => {
    const state = pollState.get(from);
    if (!state) {
      await sock.sendMessage(from, { text: '❌ Tidak ada polling aktif.' });
      return;
    }
    const total = state.ya + state.tidak + state.abstain;
    const pct = (n) => total === 0 ? 0 : Math.round((n / total) * 100);
    const pemenang = state.ya > state.tidak ? '✅ YA menang!' : state.tidak > state.ya ? '❌ TIDAK menang!' : '🤝 SERI!';
    pollState.delete(from);
    await sock.sendMessage(from, {
      text:
        `📊 *POLLING DITUTUP!*\n\n` +
        `❓ ${state.pertanyaan}\n\n` +
        `✅ Ya: ${state.ya} suara (${pct(state.ya)}%)\n` +
        `❌ Tidak: ${state.tidak} suara (${pct(state.tidak)}%)\n` +
        `🤷 Abstain: ${state.abstain} suara (${pct(state.abstain)}%)\n` +
        `─────────────────\n` +
        `👥 Total: ${total} pemilih\n` +
        `🏆 Hasil: ${pemenang}`,
    });
  },

};

export const catatanCommands = {

  catat: async (sock, from, args) => {
    const raw = args.join(' ');
    const [judul, ...isiArr] = raw.split('|');
    if (!judul || !isiArr.length) {
      await sock.sendMessage(from, { text: '❌ Format: !catat [judul] | [isi]\nContoh: !catat Rapat | Meeting besok jam 9 pagi' });
      return;
    }
    if (!catatanMap.has(from)) catatanMap.set(from, {});
    const catatan = catatanMap.get(from);
    const key = judul.trim().toLowerCase();
    catatan[key] = { judul: judul.trim(), isi: isiArr.join('|').trim(), waktu: new Date().toLocaleString('id-ID') };
    await sock.sendMessage(from, { text: `📝 Catatan *"${judul.trim()}"* berhasil disimpan!` });
  },

  lihatCatatan: async (sock, from) => {
    const catatan = catatanMap.get(from);
    if (!catatan || Object.keys(catatan).length === 0) {
      await sock.sendMessage(from, { text: '📂 Belum ada catatan tersimpan.\nGunakan *!catat [judul] | [isi]* untuk membuat catatan.' });
      return;
    }
    const list = Object.values(catatan).map((c, i) => `${i + 1}. 📝 *${c.judul}* — ${c.waktu}`).join('\n');
    await sock.sendMessage(from, {
      text: `📂 *Daftar Catatan Grup*\n\n${list}\n\nKetik *!bacaCatatan [judul]* untuk membaca isinya.`,
    });
  },

  bacaCatatan: async (sock, from, args) => {
    const key = args.join(' ').toLowerCase().trim();
    const catatan = catatanMap.get(from);
    if (!catatan || !catatan[key]) {
      await sock.sendMessage(from, { text: `❌ Catatan *"${args.join(' ')}"* tidak ditemukan.\nKetik *!lihatCatatan* untuk melihat daftar.` });
      return;
    }
    const c = catatan[key];
    await sock.sendMessage(from, {
      text: `📝 *${c.judul}*\n\n${c.isi}\n\n_Disimpan: ${c.waktu}_`,
    });
  },

  hapusCatatan: async (sock, from, args) => {
    const key = args.join(' ').toLowerCase().trim();
    const catatan = catatanMap.get(from);
    if (!catatan || !catatan[key]) {
      await sock.sendMessage(from, { text: `❌ Catatan *"${args.join(' ')}"* tidak ditemukan.` });
      return;
    }
    const judul = catatan[key].judul;
    delete catatan[key];
    await sock.sendMessage(from, { text: `🗑️ Catatan *"${judul}"* berhasil dihapus.` });
  },

};