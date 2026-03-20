// commands/anti.js — Anti Link, Anti Tag Story, Anti Badwords

import { tambahWarn, resetWarn } from "../data.js";
import { config } from "../config.js";

// ────────────────────────────────────────────
// HELPER: Auto kick setelah 3x warn
// ────────────────────────────────────────────
async function autoKick(sock, from, jid) {
  try {
    const meta = await sock.groupMetadata(from);
    const nomorMurni = jid.split("@")[0].split(":")[0];
    const participant = meta.participants.find(
      (p) => p.id.split("@")[0].split(":")[0] === nomorMurni,
    );
    if (!participant) return;
    await sock.groupParticipantsUpdate(from, [participant.id], "remove");
    resetWarn(jid);
  } catch (e) {
    console.error("[AUTOKICK] error:", e.message);
  }
}

// ────────────────────────────────────────────
// ANTI LINK
// ────────────────────────────────────────────
export async function antiLink(sock, from, msg, pengirimJid, isiPesan) {
  if (!config.antiLink) return false;

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = isiPesan.match(urlRegex) || [];
  const adaLinkTerlarang = matches.some(
    (url) => !config.linkDiizinkan.some((allowed) => url.includes(allowed)),
  );

  if (!adaLinkTerlarang) return false;

  const nomor = pengirimJid.split("@")[0].split(":")[0];

  // Hapus pesan
  try {
    await sock.sendMessage(from, { delete: msg.key });
  } catch {}

  const warn = tambahWarn(pengirimJid);
  await sock.sendMessage(from, {
    text:
      `🔗 *Anti-Link*\n\n` +
      `⚠️ Peringatan ke-*${warn}/3* untuk @${nomor}!\n` +
      `Dilarang mengirim link di grup ini.\n\n` +
      (warn >= 3
        ? `🚫 *Kamu telah dikick karena 3x melanggar!*`
        : `_Sisa ${3 - warn} peringatan sebelum dikick._`),
    mentions: [pengirimJid],
  });

  if (warn >= 3) await autoKick(sock, from, pengirimJid);
  return true;
}

// ────────────────────────────────────────────
// ANTI TAG STORY
// ────────────────────────────────────────────
export async function antiStory(sock, from, msg, pengirimJid) {
  if (!config.antiStory) return false;

  const isForward =
    msg.message?.extendedTextMessage?.contextInfo?.isForwarded &&
    msg.message?.extendedTextMessage?.contextInfo?.remoteJid?.includes(
      "status",
    );

  if (!isForward) return false;

  const nomor = pengirimJid.split("@")[0].split(":")[0];

  // Hapus pesan
  try {
    await sock.sendMessage(from, { delete: msg.key });
  } catch {}

  const warn = tambahWarn(pengirimJid);
  await sock.sendMessage(from, {
    text:
      `📵 *Anti-Story*\n\n` +
      `⚠️ Peringatan ke-*${warn}/3* untuk @${nomor}!\n` +
      `Dilarang menyebarkan story/status di grup ini.\n\n` +
      (warn >= 3
        ? `🚫 *Kamu telah dikick karena 3x melanggar!*`
        : `_Sisa ${3 - warn} peringatan sebelum dikick._`),
    mentions: [pengirimJid],
  });

  if (warn >= 3) await autoKick(sock, from, pengirimJid);
  return true;
}

// ────────────────────────────────────────────
// ANTI BADWORDS
// ────────────────────────────────────────────

// List kata kasar default bahasa Indonesia
const badwordsDefault = [
  "anjing",
  "anjir",
  "anying",
  "bangsat",
  "bangset",
  "babi",
  "bajingan",
  "bedebah",
  "keparat",
  "kurang ajar",
  "kontol",
  "memek",
  "ngentot",
  "jancok",
  "jancuk",
  "goblok",
  "goblog",
  "tolol",
  "idiot",
  "bodoh",
  "brengsek",
  "sialan",
  "setan",
  "iblis",
  "kimak",
  "kampret",
  "asu",
  "celeng",
  "tai",
  "taik",
  "tahi",
  "fuck",
  "shit",
  "asshole",
  "bastard",
  "bitch",
  "damn",
  "cunt",
  "dick",
  "pussy",
];

export async function antiBadwords(sock, from, msg, pengirimJid, isiPesan) {
  if (!config.antiBadwords) return false;
  if (isiPesan.trim().startsWith('!')) return false;

  const pesanLower = isiPesan.toLowerCase();

  // Gabungkan default + custom dari config
  const allBadwords = [...badwordsDefault, ...(config.customBadwords || [])];

  // Cek apakah ada kata kasar (pakai word boundary agar tidak false positive)
  const kataKasar = allBadwords.find((kata) => {
    const regex = new RegExp(
      `(^|\\s|[^a-z])${kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s|[^a-z])`,
      "i",
    );
    return regex.test(pesanLower);
  });

  if (!kataKasar) return false;

  const nomor = pengirimJid.split("@")[0].split(":")[0];

  // Hapus pesan
  try {
    await sock.sendMessage(from, { delete: msg.key });
  } catch {}

  const warn = tambahWarn(pengirimJid);
  await sock.sendMessage(from, {
    text:
      `🤬 *Anti-Badwords*\n\n` +
      `⚠️ Peringatan ke-*${warn}/3* untuk @${nomor}!\n` +
      `Dilarang menggunakan kata kasar di grup ini.\n\n` +
      (warn >= 3
        ? `🚫 *Kamu telah dikick karena 3x melanggar!*`
        : `_Sisa ${3 - warn} peringatan sebelum dikick._`),
    mentions: [pengirimJid],
  });

  if (warn >= 3) await autoKick(sock, from, pengirimJid);
  return true;
}

// ────────────────────────────────────────────
// COMMAND: toggle anti fitur (admin only)
// ────────────────────────────────────────────

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

export const antiCommands = {
  // !antiLink on/off
  antilink: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin yang bisa mengubah pengaturan anti-link.",
      });
      return;
    }
    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
      await sock.sendMessage(from, {
        text: `🔗 *Anti-Link sekarang: ${config.antiLink ? "ON ✅" : "OFF ❌"}*\n\nUntuk ubah: *!antiLink on* atau *!antiLink off*`,
      });
      return;
    }
    config.antiLink = status === "on";
    await sock.sendMessage(from, {
      text: `🔗 *Anti-Link* diubah ke: ${config.antiLink ? "ON ✅" : "OFF ❌"}`,
    });
  },

  // !antiStory on/off
  antistory: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin yang bisa mengubah pengaturan anti-story.",
      });
      return;
    }
    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
      await sock.sendMessage(from, {
        text: `📵 *Anti-Story sekarang: ${config.antiStory ? "ON ✅" : "OFF ❌"}*\n\nUntuk ubah: *!antiStory on* atau *!antiStory off*`,
      });
      return;
    }
    config.antiStory = status === "on";
    await sock.sendMessage(from, {
      text: `📵 *Anti-Story* diubah ke: ${config.antiStory ? "ON ✅" : "OFF ❌"}`,
    });
  },

  // !antiBadwords on/off
  antibadwords: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin yang bisa mengubah pengaturan anti-badwords.",
      });
      return;
    }
    const status = args[0]?.toLowerCase();
    if (!["on", "off"].includes(status)) {
      await sock.sendMessage(from, {
        text: `🤬 *Anti-Badwords sekarang: ${config.antiBadwords ? "ON ✅" : "OFF ❌"}*\n\nUntuk ubah: *!antiBadwords on* atau *!antiBadwords off*`,
      });
      return;
    }
    config.antiBadwords = status === "on";
    await sock.sendMessage(from, {
      text: `🤬 *Anti-Badwords* diubah ke: ${config.antiBadwords ? "ON ✅" : "OFF ❌"}`,
    });
  },

  // !tambahBadword [kata] — tambah kata kasar custom
  tambahbadword: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin yang bisa menambah kata terlarang.",
      });
      return;
    }
    const kata = args.join(" ").toLowerCase().trim();
    if (!kata) {
      await sock.sendMessage(from, {
        text: "❌ Masukkan kata yang ingin ditambahkan.\nContoh: !tambahBadword katakasar",
      });
      return;
    }
    if (!config.customBadwords) config.customBadwords = [];
    if (config.customBadwords.includes(kata)) {
      await sock.sendMessage(from, {
        text: `⚠️ Kata *"${kata}"* sudah ada di daftar.`,
      });
      return;
    }
    config.customBadwords.push(kata);
    await sock.sendMessage(from, {
      text: `✅ Kata *"${kata}"* ditambahkan ke daftar terlarang.`,
    });
  },

  // !hapusBadword [kata] — hapus kata kasar custom
  hapusbadword: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin yang bisa menghapus kata terlarang.",
      });
      return;
    }
    const kata = args.join(" ").toLowerCase().trim();
    if (!kata) {
      await sock.sendMessage(from, {
        text: "❌ Masukkan kata yang ingin dihapus.\nContoh: !hapusBadword katakasar",
      });
      return;
    }
    if (!config.customBadwords?.includes(kata)) {
      await sock.sendMessage(from, {
        text: `❌ Kata *"${kata}"* tidak ada di daftar custom.`,
      });
      return;
    }
    config.customBadwords = config.customBadwords.filter((k) => k !== kata);
    await sock.sendMessage(from, {
      text: `✅ Kata *"${kata}"* dihapus dari daftar terlarang.`,
    });
  },

  // !daftarBadword — lihat semua kata terlarang custom
  daftarbadword: async (sock, from, args, pengirimJid) => {
    if (!(await isAdminGrup(sock, from, pengirimJid))) {
      await sock.sendMessage(from, {
        text: "❌ Hanya admin yang bisa melihat daftar kata terlarang.",
      });
      return;
    }
    const custom = config.customBadwords || [];
    if (custom.length === 0) {
      await sock.sendMessage(from, {
        text: "📭 Belum ada kata terlarang custom.\nGunakan *!tambahBadword [kata]* untuk menambahkan.",
      });
      return;
    }
    await sock.sendMessage(from, {
      text: `🚫 *Daftar Kata Terlarang Custom*\nTotal: ${custom.length} kata\n\n${custom.map((k, i) => `${i + 1}. ${k}`).join("\n")}`,
    });
  },

  // !cekAnti — lihat status semua fitur anti
  cekanti: async (sock, from) => {
    await sock.sendMessage(from, {
      text:
        `🛡️ *Status Fitur Anti*\n\n` +
        `🔗 Anti-Link: ${config.antiLink ? "ON ✅" : "OFF ❌"}\n` +
        `📵 Anti-Story: ${config.antiStory ? "ON ✅" : "OFF ❌"}\n` +
        `🤬 Anti-Badwords: ${config.antiBadwords ? "ON ✅" : "OFF ❌"}\n\n` +
        `📝 Kata custom: ${(config.customBadwords || []).length} kata`,
    });
  },
};
