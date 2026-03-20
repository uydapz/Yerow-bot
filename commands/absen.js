// commands/absen.js — Sistem absen & profil member

import { tambahAbsen, getAbsen, getAllMember, tambahMember } from "../data.js";

function tanggalHariIni() {
  return new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" });
}

function getMingguIni() {
  const result = [];
  const now = new Date();
  const hariIni = now.getDay(); // 0=minggu
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - hariIni + i);
    result.push(d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }));
  }
  return result;
}

export default {
  absen: async (sock, from, args, pengirimJid) => {
    const nomorPengirim = pengirimJid.split("@")[0];
    const hari = tanggalHariIni();
    const keterangan = args.join(" ") || "Hadir";
    const berhasil = tambahAbsen(hari, pengirimJid, nomorPengirim, keterangan);
    if (berhasil) {
      await sock.sendMessage(from, {
        text: `✅ *Absen berhasil!*\n\n👤 @${nomorPengirim}\n📅 ${hari}\n📝 Keterangan: ${keterangan}`,
        mentions: [pengirimJid],
      });
    } else {
      await sock.sendMessage(from, {
        text: `ℹ️ @${nomorPengirim}, kamu sudah absen hari ini.\nKetik *!lihatAbsen* untuk melihat daftarnya.`,
        mentions: [pengirimJid],
      });
    }
  },

  lihatAbsen: async (sock, from, args) => {
    const tanggal = args[0] || tanggalHariIni();
    const list = getAbsen(tanggal);
    const mentions = list.map((m) => m.jid);
    const isi =
      list.length === 0
        ? "_Belum ada yang absen._"
        : list
            .map(
              (m, i) =>
                `${i + 1}. @${m.jid.split("@")[0]} — ${m.waktu} (${m.keterangan})`,
            )
            .join("\n");
    await sock.sendMessage(from, {
      text: `📋 *Daftar Absen — ${tanggal}*\nTotal: *${list.length} orang*\n\n${isi}`,
      mentions,
    });
  },

  rekapAbsen: async (sock, from) => {
    const minggu = getMingguIni();
    let teks = `📊 *Rekap Absen Minggu Ini*\n\n`;
    for (const tgl of minggu) {
      const list = getAbsen(tgl);
      teks += `📅 ${tgl}: *${list.length} orang*\n`;
    }
    await sock.sendMessage(from, { text: teks });
  },

  profil: async (sock, from, args, pengirimJid, mentionedJids) => {
    const targetJid = mentionedJids?.[0] || pengirimJid;
    const nomorTarget = targetJid.split("@")[0];
    const member = getAllMember().get(targetJid);
    const absenHariIni = getAbsen(tanggalHariIni());
    const sudahAbsen = absenHariIni.find((m) => m.jid === targetJid);

    try {
      const meta = await sock.groupMetadata(from);
      const participant = meta.participants.find((p) => p.id === targetJid);
      const role =
        participant?.admin === "superadmin"
          ? "👑 Owner"
          : participant?.admin === "admin"
            ? "🛡️ Admin"
            : "👤 Member";

      await sock.sendMessage(from, {
        text:
          `👤 *Profil Member*\n\n` +
          `📱 Nomor: @${nomorTarget}\n` +
          `🏷️ Role: ${role}\n` +
          `📅 Bergabung: ${member?.bergabung || "_Tidak diketahui_"}\n` +
          `✅ Absen hari ini: ${sudahAbsen ? `Ya (${sudahAbsen.waktu})` : "Belum"}`,
        mentions: [targetJid],
      });
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil profil." });
    }
  },
};
