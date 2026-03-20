// commands/premium.js — Command aktivasi & manajemen lisensi

import {
  generateKode,
  tambahKode,
  aktivasiKode,
  isGrupAktif,
  infoLisensi,
  semuaKode,
  semuaGrup,
  hapusKode,
  perpanjangLisensi,
  nonaktifkanGrup,
} from "../license.js";
import { config } from "../config.js";

// Format tanggal
function formatTgl(ms) {
  return new Date(ms).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
}

// Format sisa waktu
function sisaWaktu(ms) {
  const sisa = ms - Date.now();
  if (sisa <= 0) return "Sudah expired";
  const hari = Math.floor(sisa / 86400000);
  const jam = Math.floor((sisa % 86400000) / 3600000);
  const menit = Math.floor((sisa % 3600000) / 60000);
  if (hari > 0) return `${hari} hari ${jam} jam lagi`;
  if (jam > 0) return `${jam} jam ${menit} menit lagi`;
  return `${menit} menit lagi`;
}

// Cek apakah pengirim adalah owner bot
function isOwner(jid) {
  const nomor = jid.split("@")[0].split(":")[0];
  return config.ownerNumber === nomor;
}

export default {
  // ── !cekOwner — debug cek apakah kamu owner ──
  cekowner: async (sock, from, args, pengirimJid) => {
    const nomor = pengirimJid.split("@")[0].split(":")[0];
    const owner = isOwner(pengirimJid);
    await sock.sendMessage(from, {
      text:
        `🔍 *Debug Owner*\n\n` +
        `📱 JID kamu: \`${pengirimJid}\`\n` +
        `🔢 Nomor terdeteksi: \`${nomor}\`\n` +
        `⚙️ ownerNumber di config: \`${config.ownerNumber}\`\n` +
        `✅ Status: *${owner ? "OWNER ✅" : "BUKAN OWNER ❌"}*`,
    });
  },

  // ── !aktif — hanya owner bot yang bisa aktivasi ──
  aktif: async (sock, from, args, pengirimJid) => {
    // Cek apakah sudah aktif
    if (isGrupAktif(from)) {
      const info = infoLisensi(from);
      await sock.sendMessage(from, {
        text:
          `✅ *Bot sudah aktif di grup ini!*\n\n` +
          `📅 Aktif sejak: ${formatTgl(info.aktifSejak)}\n` +
          `⏳ Expired: ${formatTgl(info.expiredAt)}\n` +
          `🕐 Sisa: ${sisaWaktu(info.expiredAt)}`,
      });
      return;
    }

    // Hanya owner bot yang boleh aktivasi
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text:
          `🔒 *Yerow belum diaktivasi!*\n\n` +
          `Hubungi owner untuk mengaktifkan bot di grup ini.\n` +
          `📞 Owner: *082141331105*`,
      });
      return;
    }

    // Auto generate kode + aktivasi langsung
    const durasi = parseInt(args[0]) || 30;
    const satuan = args[1] || "hari";
    const satuanValid = ["jam", "hari", "bulan", "tahun"];

    if (!satuanValid.includes(satuan)) {
      await sock.sendMessage(from, {
        text: "❌ Satuan tidak valid.\nGunakan: jam / hari / bulan / tahun\nContoh: !aktif 30 hari",
      });
      return;
    }

    const kode = generateKode();
    tambahKode(kode, durasi, satuan, `Auto - ${from.split("@")[0]}`);
    const result = aktivasiKode(kode, from);

    if (!result.ok) {
      await sock.sendMessage(from, {
        text: `❌ Gagal aktivasi: ${result.msg}`,
      });
      return;
    }

    await sock.sendMessage(from, {
      text:
        `🎉 *Bot berhasil diaktivasi!*\n\n` +
        `🔑 Kode: \`${kode}\`\n` +
        `📅 Aktif: ${formatTgl(Date.now())}\n` +
        `⏳ Expired: ${formatTgl(result.expiredAt)}\n` +
        `🕐 Durasi: *${durasi} ${satuan}*\n\n` +
        `Ketik *!help* untuk melihat semua fitur.`,
    });
  },

  // ── !infoBot — cek status lisensi grup ──
  infobot: async (sock, from) => {
    if (!isGrupAktif(from)) {
      await sock.sendMessage(from, {
        text:
          `🔒 *Bot belum diaktivasi di grup ini!*\n\n` +
          `Ketik *!aktif [kode]* untuk mengaktifkan.\n` +
          `Hubungi owner untuk mendapatkan kode.`,
      });
      return;
    }
    const info = infoLisensi(from);
    await sock.sendMessage(from, {
      text:
        `🤖 *Info Lisensi Bot*\n\n` +
        `✅ Status: *AKTIF*\n` +
        `🔑 Kode: \`${info.kode}\`\n` +
        `📅 Aktif sejak: ${formatTgl(info.aktifSejak)}\n` +
        `⏳ Expired: ${formatTgl(info.expiredAt)}\n` +
        `🕐 Sisa: *${sisaWaktu(info.expiredAt)}*`,
    });
  },

  // ── !genKode [durasi] [satuan] [catatan] — generate kode (owner only) ──
  genkode: async (sock, from, args, pengirimJid) => {
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk owner bot.",
      });
      return;
    }

    const durasi = parseInt(args[0]) || 30;
    const satuan = args[1] || "hari";
    const catatan = args.slice(2).join(" ") || "";

    const satuanValid = ["jam", "hari", "bulan", "tahun"];
    if (!satuanValid.includes(satuan)) {
      await sock.sendMessage(from, {
        text: `❌ Satuan tidak valid.\nGunakan: jam / hari / bulan / tahun\nContoh: !genKode 30 hari nama-pembeli`,
      });
      return;
    }

    const kode = generateKode();
    tambahKode(kode, durasi, satuan, catatan);

    await sock.sendMessage(from, {
      text:
        `✅ *Kode Baru Dibuat!*\n\n` +
        `🔑 Kode: *\`${kode}\`*\n` +
        `⏳ Durasi: *${durasi} ${satuan}*\n` +
        `📝 Catatan: ${catatan || "-"}\n\n` +
        `_Kirimkan kode ini ke pembeli._\n` +
        `_Cara aktivasi: !aktif ${kode}_`,
    });
  },

  // ── !daftarKode — lihat semua kode (owner only) ──
  daftarkode: async (sock, from, args, pengirimJid) => {
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk owner bot.",
      });
      return;
    }

    const semua = semuaKode();
    const list = Object.entries(semua);
    if (list.length === 0) {
      await sock.sendMessage(from, { text: "📭 Belum ada kode yang dibuat." });
      return;
    }

    const teks = list
      .map(
        ([kode, info], i) =>
          `${i + 1}. \`${kode}\`\n` +
          `   ⏳ ${info.durasi} ${info.satuan}\n` +
          `   ${info.used ? `✅ Dipakai: ${info.usedBy?.split("@")[0]}` : "🟡 Belum dipakai"}\n` +
          `   📝 ${info.catatan || "-"}`,
      )
      .join("\n\n");

    await sock.sendMessage(from, {
      text: `🔑 *Daftar Kode Aktivasi*\nTotal: ${list.length} kode\n\n${teks}`,
    });
  },

  // ── !daftarGrup — lihat semua grup aktif (owner only) ──
  daftargrup: async (sock, from, args, pengirimJid) => {
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk owner bot.",
      });
      return;
    }

    const semua = semuaGrup();
    const list = Object.entries(semua);
    if (list.length === 0) {
      await sock.sendMessage(from, { text: "📭 Belum ada grup yang aktif." });
      return;
    }

    const teks = list
      .map(([jid, info], i) => {
        const aktif = Date.now() < info.expiredAt;
        return (
          `${i + 1}. ${aktif ? "✅" : "❌"} \`${jid.split("@")[0]}\`\n` +
          `   🔑 Kode: ${info.kode}\n` +
          `   ⏳ Expired: ${formatTgl(info.expiredAt)}\n` +
          `   🕐 Sisa: ${sisaWaktu(info.expiredAt)}`
        );
      })
      .join("\n\n");

    await sock.sendMessage(from, {
      text: `🏘️ *Daftar Grup Aktif*\nTotal: ${list.length} grup\n\n${teks}`,
    });
  },

  // ── !perpanjang [grupId/this] [durasi] [satuan] — perpanjang lisensi (owner only) ──
  perpanjang: async (sock, from, args, pengirimJid) => {
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk owner bot.",
      });
      return;
    }

    const targetGrup = args[0] === "this" ? from : args[0] + "@g.us";
    const durasi = parseInt(args[1]) || 30;
    const satuan = args[2] || "hari";

    const hasil = perpanjangLisensi(targetGrup, durasi, satuan);
    if (!hasil) {
      await sock.sendMessage(from, {
        text: `❌ Grup tidak ditemukan di database.`,
      });
      return;
    }

    await sock.sendMessage(from, {
      text:
        `✅ *Lisensi diperpanjang!*\n\n` +
        `🏘️ Grup: \`${targetGrup.split("@")[0]}\`\n` +
        `⏳ +${durasi} ${satuan}\n` +
        `📅 Expired baru: ${formatTgl(hasil)}`,
    });
  },

  // ── !hapusKode [kode] — hapus kode (owner only) ──
  hapuskode: async (sock, from, args, pengirimJid) => {
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk owner bot.",
      });
      return;
    }
    const kode = args[0]?.toUpperCase();
    if (!kode) {
      await sock.sendMessage(from, {
        text: "❌ Masukkan kode yang ingin dihapus.\nContoh: !hapusKode AB12-CD34-EF56",
      });
      return;
    }
    const ok = hapusKode(kode);
    await sock.sendMessage(from, {
      text: ok
        ? `✅ Kode \`${kode}\` berhasil dihapus.`
        : `❌ Kode \`${kode}\` tidak ditemukan.`,
    });
  },

  // ── !nonaktif [grupId/this] — nonaktifkan lisensi grup (owner only) ──
  nonaktif: async (sock, from, args, pengirimJid) => {
    if (!isOwner(pengirimJid)) {
      await sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk owner bot.",
      });
      return;
    }

    const targetGrup =
      !args[0] || args[0] === "this"
        ? from
        : args[0].includes("@g.us")
          ? args[0]
          : args[0] + "@g.us";

    const result = nonaktifkanGrup(targetGrup);
    if (!result.ok) {
      await sock.sendMessage(from, { text: `❌ ${result.msg}` });
      return;
    }

    await sock.sendMessage(from, {
      text:
        `🚫 *Langganan dinonaktifkan!*\n\n` +
        `🏘️ Grup: \`${targetGrup.split("@")[0]}\`\n` +
        `📅 Nonaktif sejak: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n\n` +
        `_Ketik !aktif untuk mengaktifkan kembali._`,
    });

    // Kirim notif ke grup yang dinonaktifkan (kalau beda grup)
    if (targetGrup !== from) {
      try {
        await sock.sendMessage(targetGrup, {
          text:
            `🚫 *Langganan bot telah dinonaktifkan.*\n\n` +
            `Hubungi owner untuk mengaktifkan kembali.\n` +
            `📞 Owner: *${config.ownerNumber}*`,
        });
      } catch {}
    }
  },
};
