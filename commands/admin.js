// commands/admin.js — Perintah admin grup
// Semua command berbahaya hanya bisa dipakai oleh admin grup

import { tambahWarn, resetWarn, getWarn } from "../data.js";

// ── Cek apakah pengirim adalah admin grup ──
async function isAdminGrup(sock, from, jid) {
  try {
    const meta = await sock.groupMetadata(from);
    const fixedJid = jid.split(":")[0] + "@s.whatsapp.net";
    return meta.participants.some(
      (p) =>
        (p.id === jid || p.id === fixedJid) &&
        (p.admin === "admin" || p.admin === "superadmin"),
    );
  } catch {
    return false;
  }
}

export default {
  // ── !kick @member ──
  kick: async (sock, from, args, pengirimJid, mentionedJids) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa menggunakan *!kick*.",
      });
      return;
    }
    const targetJid = mentionedJids?.[0];
    if (!targetJid) {
      await sock.sendMessage(from, {
        text: "❌ Tag member yang ingin dikick.\nContoh: !kick @nomor",
      });
      return;
    }

    // Ambil JID asli dari metadata grup (bukan dari mention)
    // karena mention bisa return @lid yang tidak valid untuk kick
    let fixedTarget = targetJid;
    try {
      const meta = await sock.groupMetadata(from);
      const nomorMurni = targetJid.split("@")[0].split(":")[0];

      // Cari participant yang cocok di grup
      const participant = meta.participants.find((p) => {
        const pNomor = p.id.split("@")[0].split(":")[0];
        return pNomor === nomorMurni;
      });

      if (participant) {
        fixedTarget = participant.id; // pakai JID asli dari grup
      } else {
        await sock.sendMessage(from, {
          text: "❌ Member tidak ditemukan di grup ini.",
        });
        return;
      }
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil data grup: ${e.message}`,
      });
      return;
    }

    console.log("[KICK] target fixed dari metadata:", fixedTarget);

    try {
      await sock.groupParticipantsUpdate(from, [fixedTarget], "remove");
      await sock.sendMessage(from, {
        text: `✅ @${fixedTarget.split("@")[0].split(":")[0]} telah dikick dari grup.`,
        mentions: [fixedTarget],
      });
    } catch (e) {
      console.error("[KICK] error:", e.message);
      await sock.sendMessage(from, { text: `❌ Gagal kick: ${e.message}` });
    }
  },

  // ── !warn @member [alasan] ──
  warn: async (sock, from, args, pengirimJid, mentionedJids) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa menggunakan *!warn*.",
      });
      return;
    }
    const targetJid = mentionedJids?.[0];
    if (!targetJid) {
      await sock.sendMessage(from, {
        text: "❌ Tag member yang ingin diwarn.\nContoh: !warn @nomor alasan",
      });
      return;
    }
    const alasan = args.slice(1).join(" ") || "Melanggar peraturan grup";
    const jumlahWarn = tambahWarn(targetJid);
    await sock.sendMessage(from, {
      text:
        `⚠️ *PERINGATAN!*\n\n` +
        `👤 Member: @${targetJid.split("@")[0]}\n` +
        `📝 Alasan: ${alasan}\n` +
        `🔢 Warn: ${jumlahWarn}/3\n\n` +
        (jumlahWarn >= 3
          ? `🚫 Sudah 3 kali! Akan dikick.`
          : `_${3 - jumlahWarn} peringatan lagi sebelum dikick._`),
      mentions: [targetJid],
    });
    if (jumlahWarn >= 3) {
      const fixedTarget = targetJid.split("@")[0] + "@s.whatsapp.net";
      try {
        await sock.groupParticipantsUpdate(from, [fixedTarget], "remove");
        resetWarn(targetJid);
        await sock.sendMessage(from, {
          text: `🚫 @${fixedTarget.split("@")[0]} dikick karena 3x peringatan.`,
          mentions: [fixedTarget],
        });
      } catch (e) {
        await sock.sendMessage(from, {
          text: `❌ Gagal auto-kick: ${e.message}`,
        });
      }
    }
  },

  // ── !cekWarn @member ──
  cekWarn: async (sock, from, args, pengirimJid, mentionedJids) => {
    const targetJid = mentionedJids?.[0] || pengirimJid;
    const jumlah = getWarn(targetJid);
    await sock.sendMessage(from, {
      text: `🔍 *Cek Peringatan*\n\n👤 @${targetJid.split("@")[0]}\n⚠️ Warn: ${jumlah}/3`,
      mentions: [targetJid],
    });
  },

  // ── !resetWarn @member ──
  resetWarn: async (sock, from, args, pengirimJid, mentionedJids) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa reset peringatan.",
      });
      return;
    }
    const targetJid = mentionedJids?.[0];
    if (!targetJid) {
      await sock.sendMessage(from, {
        text: "❌ Tag member yang ingin direset warnnya.",
      });
      return;
    }
    resetWarn(targetJid);
    await sock.sendMessage(from, {
      text: `✅ Peringatan @${targetJid.split("@")[0]} direset ke 0.`,
      mentions: [targetJid],
    });
  },

  // ── !mute ──
  mute: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa mengunci grup.",
      });
      return;
    }
    try {
      await sock.groupSettingUpdate(from, "announcement");
      await sock.sendMessage(from, {
        text: "🔇 *Grup dikunci!* Hanya admin yang bisa mengirim pesan.",
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal kunci grup: ${e.message}`,
      });
    }
  },

  // ── !unmute ──
  unmute: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa membuka kunci grup.",
      });
      return;
    }
    try {
      await sock.groupSettingUpdate(from, "not_announcement");
      await sock.sendMessage(from, {
        text: "🔊 *Grup dibuka!* Semua member bisa mengirim pesan.",
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal buka grup: ${e.message}`,
      });
    }
  },

  // ── !tagAll [pesan] ──
  tagAll: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa tag semua member.",
      });
      return;
    }
    try {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants;
      const pesan = args.join(" ") || "📢 Perhatian semua member!";
      const mentions = members.map((m) => m.id);
      const tagList = members.map((m) => `@${m.id.split("@")[0]}`).join(" ");
      await sock.sendMessage(from, {
        text: `📢 *${pesan}*\n\n${tagList}`,
        mentions,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal tag semua: ${e.message}`,
      });
    }
  },

  // ── !pengumuman [isi] ──
  pengumuman: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin grup yang bisa membuat pengumuman.",
      });
      return;
    }
    const isi = args.join(" ");
    if (!isi) {
      await sock.sendMessage(from, {
        text: "❌ Isi pengumuman kosong!\nContoh: !pengumuman Rapat besok jam 9.",
      });
      return;
    }
    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });
    await sock.sendMessage(from, {
      text:
        `📣 *PENGUMUMAN*\n` +
        `${"─".repeat(25)}\n\n` +
        `${isi}\n\n` +
        `${"─".repeat(25)}\n` +
        `🕐 ${now}`,
    });
  },

  // ── !ingatkan [menit] [pesan] — siapa saja bisa pakai ──
  ingatkan: async (sock, from, args) => {
    const menit = parseInt(args[0]);
    const pesan = args.slice(1).join(" ");
    if (isNaN(menit) || menit < 1 || menit > 1440) {
      await sock.sendMessage(from, {
        text: "❌ Format: !ingatkan [menit 1-1440] [pesan]\nContoh: !ingatkan 30 Waktunya sholat!",
      });
      return;
    }
    if (!pesan) {
      await sock.sendMessage(from, { text: "❌ Isi pesan reminder kosong!" });
      return;
    }
    await sock.sendMessage(from, {
      text: `⏰ Reminder diset dalam *${menit} menit*.\n📝 "${pesan}"`,
    });
    setTimeout(
      async () => {
        await sock.sendMessage(from, { text: `⏰ *REMINDER!*\n\n${pesan}` });
      },
      menit * 60 * 1000,
    );
  },

  // ── !listMember — siapa saja bisa lihat ──
  listMember: async (sock, from) => {
    try {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants;
      const owner =
        members
          .filter((m) => m.admin === "superadmin")
          .map((m) => `👑 @${m.id.split("@")[0]}`)
          .join("\n") || "-";
      const admins =
        members
          .filter((m) => m.admin === "admin")
          .map((m) => `🛡️ @${m.id.split("@")[0]}`)
          .join("\n") || "-";
      const biasa =
        members
          .filter((m) => !m.admin)
          .map((m) => `👤 @${m.id.split("@")[0]}`)
          .join("\n") || "-";
      await sock.sendMessage(from, {
        text:
          `👥 *Daftar Member Grup*\n` +
          `Total: *${members.length} orang*\n\n` +
          `👑 *Owner:*\n${owner}\n\n` +
          `🛡️ *Admin:*\n${admins}\n\n` +
          `👤 *Member:*\n${biasa}`,
        mentions: members.map((m) => m.id),
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil member: ${e.message}`,
      });
    }
  },
};
