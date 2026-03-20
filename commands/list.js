// commands/list.js

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data");
const LIST_FILE = join(DATA_DIR, "lists.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ── Helper baca/tulis ──
function bacaList() {
  if (!existsSync(LIST_FILE)) return {};
  try {
    return JSON.parse(readFileSync(LIST_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function simpanList(data) {
  writeFileSync(LIST_FILE, JSON.stringify(data, null, 2));
}

function parseItems(teks) {
  const hasil = [];
  for (const baris of teks.split("\n")) {
    const b = baris.trim();
    if (!b) continue;
    if (b.startsWith("!")) continue;

    const isHeader =
      b.startsWith(">") ||
      b.startsWith("*") ||
      b.startsWith("_") ||
      b.startsWith("```");

    if (isHeader) {
      const header = b
        .replace(/^>\s*/, "")
        .replace(/^```|```$/g, "")
        .replace(/^\*+|\*+$/g, "")
        .replace(/^_+|_+$/g, "")
        .trim();
      if (header) hasil.push({ type: "header", text: header });
    } else {
      const bersih = b
        .replace(/^\s*\d+[\.\)]\s*/, "")
        .replace(/^[-•]\s*/, "")
        .trim();
      if (bersih)
        hasil.push({
          type: "item",
          text: bersih,
          originalText: b, // simpan teks asli untuk cek nomor
        });
    }
  }
  return hasil;
}

// ── Format list jadi teks WA ──
function formatList(items) {
  return items
    .map((item) => {
      if (item.type === "header") return `\n*${item.text}*`;
      // Kalau ada nomor asli, pakai. Kalau tidak, pakai bullet
      if (item.originalText && /^\d+[\.\)]/.test(item.originalText)) {
        const nomor = item.originalText.match(/^(\d+[\.\)])/)[1];
        return `${nomor} ${item.text}`;
      }
      return `• ${item.text}`;
    })
    .join("\n");
}

const listCommands = {
  // ────────────────────────────────
  // !list / !list [nama]
  // ────────────────────────────────
  list: async (sock, from, args) => {
    const nama = args[0]?.toLowerCase();
    const data = bacaList();
    const grupData = data[from] || {};

    if (!nama) {
      const keys = Object.keys(grupData);
      if (keys.length === 0) {
        await sock.sendMessage(from, {
          text: `📋 Belum ada list.\nGunakan *!addlist [nama]* untuk membuat list baru.`,
        });
        return;
      }
      await sock.sendMessage(from, {
        text:
          `📋 *Daftar List Grup*\n\n` +
          keys
            .map((k, i) => {
              const total = grupData[k].filter((x) => x.type === "item").length;
              return `${i + 1}. *${k}* — ${total} item`;
            })
            .join("\n") +
          `\n\n_Ketik !list [nama] untuk melihat isinya_`,
      });
      return;
    }

    if (!grupData[nama]) {
      await sock.sendMessage(from, {
        text: `❌ List *"${nama}"* tidak ditemukan.`,
      });
      return;
    }

    const items = grupData[nama];
    const totalItem = items.filter((i) => i.type === "item").length;

    await sock.sendMessage(from, {
      text:
        `📋 *${nama.toUpperCase()}*\n` +
        `Total: *${totalItem} item*\n` +
        formatList(items),
    });
  },

  // ────────────────────────────────
  // !addlist [nama] (reply atau tulis langsung)
  // ────────────────────────────────
  addlist: async (sock, from, args, pengirimJid, mentionedJids, msg) => {
    const nama = args[0]?.toLowerCase();

    if (!nama) {
      await sock.sendMessage(from, {
        text:
          `📋 *!addlist [nama]*\n\n` +
          `• Reply pesan lalu ketik *!addlist [nama]*\n` +
          `• Atau *!addlist [nama] item1, item2, ...*`,
      });
      return;
    }

    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText =
      quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || "";
    const isiArgs = args.slice(1).join(" ").trim();
    const isi = quotedText || isiArgs;

    if (!isi) {
      await sock.sendMessage(from, {
        text: `❌ Reply pesan atau tulis isi setelah nama list.`,
      });
      return;
    }

    const items = isi.includes("\n")
      ? parseItems(isi)
      : isi
          .split(",")
          .map((i) => ({ type: "item", text: i.trim() }))
          .filter((i) => i.text);

    if (items.length === 0) {
      await sock.sendMessage(from, {
        text: `❌ Tidak ada item yang bisa diambil.`,
      });
      return;
    }

    const data = bacaList();
    if (!data[from]) data[from] = {};
    if (!data[from][nama]) data[from][nama] = [];

    let tambah = 0;
    for (const item of items) {
      const exists = data[from][nama].some(
        (i) => i.type === item.type && i.text === item.text,
      );
      if (!exists) {
        data[from][nama].push(item);
        tambah++;
      }
    }

    simpanList(data);

    const totalItem = data[from][nama].filter((i) => i.type === "item").length;

    await sock.sendMessage(from, {
      text:
        `✅ *${tambah} item ditambahkan ke "${nama}"*\n` +
        `Total: *${totalItem} item*\n` +
        formatList(data[from][nama]),
    });
  },

  // ────────────────────────────────
  // !dellist [nama] / !dellist [nama] [nomor/teks]
  // ────────────────────────────────
  dellist: async (sock, from, args) => {
    const nama = args[0]?.toLowerCase();
    const target = args.slice(1).join(" ").trim();

    if (!nama) {
      await sock.sendMessage(from, {
        text:
          `🗑️ *!dellist [nama]* — hapus seluruh list\n` +
          `🗑️ *!dellist [nama] [nomor]* — hapus item by nomor\n` +
          `🗑️ *!dellist [nama] [teks]* — hapus item by teks`,
      });
      return;
    }

    const data = bacaList();
    if (!data[from]?.[nama]) {
      await sock.sendMessage(from, {
        text: `❌ List *"${nama}"* tidak ditemukan.`,
      });
      return;
    }

    // Hapus seluruh list
    if (!target) {
      delete data[from][nama];
      simpanList(data);
      await sock.sendMessage(from, {
        text: `✅ List *"${nama}"* berhasil dihapus.`,
      });
      return;
    }

    // Hapus by nomor (hitung hanya type: item)
    const nomorTarget = parseInt(target);
    if (!isNaN(nomorTarget)) {
      let counter = 0;
      let indexHapus = -1;
      for (let i = 0; i < data[from][nama].length; i++) {
        if (data[from][nama][i].type === "item") {
          counter++;
          if (counter === nomorTarget) {
            indexHapus = i;
            break;
          }
        }
      }
      if (indexHapus === -1) {
        await sock.sendMessage(from, {
          text: `❌ Nomor *${nomorTarget}* tidak ditemukan.`,
        });
        return;
      }
      const hapus = data[from][nama].splice(indexHapus, 1)[0];
      simpanList(data);
      const sisa = data[from][nama].filter((i) => i.type === "item").length;
      await sock.sendMessage(from, {
        text:
          `✅ Item *"${hapus.text}"* dihapus dari "${nama}".\n` +
          `Sisa: *${sisa} item*`,
      });
      return;
    }

    // Hapus by teks
    const before = data[from][nama].length;
    data[from][nama] = data[from][nama].filter(
      (i) => i.text.toLowerCase() !== target.toLowerCase(),
    );
    if (data[from][nama].length === before) {
      await sock.sendMessage(from, {
        text: `❌ Item *"${target}"* tidak ditemukan.`,
      });
      return;
    }
    simpanList(data);
    const sisa = data[from][nama].filter((i) => i.type === "item").length;
    await sock.sendMessage(from, {
      text:
        `✅ Item *"${target}"* dihapus dari "${nama}".\n` +
        `Sisa: *${sisa} item*`,
    });
  },

  // ────────────────────────────────
  // !resetlist [nama]
  // ────────────────────────────────
  resetlist: async (sock, from, args) => {
    const nama = args[0]?.toLowerCase();
    if (!nama) {
      await sock.sendMessage(from, { text: `🔄 *!resetlist [nama]*` });
      return;
    }
    const data = bacaList();
    if (!data[from]?.[nama]) {
      await sock.sendMessage(from, {
        text: `❌ List *"${nama}"* tidak ditemukan.`,
      });
      return;
    }
    data[from][nama] = [];
    simpanList(data);
    await sock.sendMessage(from, {
      text: `✅ List *"${nama}"* berhasil dikosongkan.`,
    });
  },

  // ────────────────────────────────
  // !updatelist [nama] [nomor] [isi baru]
  // ────────────────────────────────
  updatelist: async (sock, from, args) => {
    const nama = args[0]?.toLowerCase();
    const nomor = parseInt(args[1]);
    const isiBaru = args.slice(2).join(" ").trim();

    if (!nama || isNaN(nomor) || !isiBaru) {
      await sock.sendMessage(from, {
        text:
          `✏️ *!updatelist [nama] [nomor] [isi baru]*\n\n` +
          `Contoh: \`!updatelist bayi 3 Abyan: sang pejuang\``,
      });
      return;
    }

    const data = bacaList();
    if (!data[from]?.[nama]) {
      await sock.sendMessage(from, {
        text: `❌ List *"${nama}"* tidak ditemukan.`,
      });
      return;
    }

    // Cari item ke-nomor (hitung hanya type: item)
    let counter = 0;
    let indexTarget = -1;
    for (let i = 0; i < data[from][nama].length; i++) {
      if (data[from][nama][i].type === "item") {
        counter++;
        if (counter === nomor) {
          indexTarget = i;
          break;
        }
      }
    }

    if (indexTarget === -1) {
      await sock.sendMessage(from, {
        text: `❌ Nomor *${nomor}* tidak valid.`,
      });
      return;
    }

    const lama = data[from][nama][indexTarget].text;
    data[from][nama][indexTarget].text = isiBaru;
    simpanList(data);

    await sock.sendMessage(from, {
      text:
        `✅ Item *${nomor}* di "${nama}" diperbarui!\n\n` +
        `Sebelum: _${lama}_\n` +
        `Sesudah: *${isiBaru}*`,
    });
  },
};

export default listCommands;
