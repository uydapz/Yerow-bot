// index.js — Bot WhatsApp Grup
// Hanya sebagai pusat koneksi & router. Semua command ada di folder /commands/

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import cron from "node-cron";
import qrcode from "qrcode-terminal";

// ── Import semua command ──
import downloader from "./commands/downloader.js";
import listCommands from "./commands/list.js";
import umum from "./commands/umum.js";
import absen from "./commands/absen.js";
import game from "./commands/game.js";
import admin from "./commands/admin.js";
import tools from "./commands/tools.js";
import extras from "./commands/extras.js";

import { pollCommands, catatanCommands } from "./commands/poll.js";
import premium from "./commands/premium.js";
import {
  antiLink,
  antiStory,
  antiBadwords,
  antiCommands,
} from "./commands/anti.js";
import { handleMedia } from "./commands/media.js";

import { config } from "./config.js";
import { tambahMember, getAbsen } from "./data.js";
import { isGrupAktif } from "./license.js";

// ── Gabungkan semua command jadi satu map ──
const commands = {
  ...umum,
  ...absen,
  ...game,
  ...tools,
  ...extras,
  ...admin,
  ...pollCommands,
  ...listCommands,
  ...catatanCommands,
  ...premium,
  ...antiCommands,
  ...downloader,
};

// ── Alias command (case insensitive) ──
const alias = {
  help: "help",
  lihatabsen: "lihatabsen",
  rekapabsen: "rekapabsen",
  listmember: "listmember",
  hasilpoll: "hasilpoll",
  tutuppoll: "tutuppoll",
  lihatcatatan: "lihatcatatan",
  bacacatatan: "bacacatatan",
  hapuscatatan: "hapuscatatan",
  cekwarn: "cekwarn",
  resetwarn: "resetwarn",
  tebakangka: "tebakangka",
  tagall: "tagall",
  "8ball": "8ball",
  infobot: "infobot",
  genkode: "genkode",
  daftarkode: "daftarkode",
  daftargrup: "daftargrup",
  hapuskode: "hapuskode",
  perpanjang: "perpanjang",
  aktif: "aktif",
  nonaktif: "nonaktif",
  cekowner: "cekowner",
  antilink: "antilink",
  antistory: "antistory",
  antibadwords: "antibadwords",
  tambahbadword: "tambahbadword",
  hapusbadword: "hapusbadword",
  daftarbadword: "daftarbadword",
  cekanti: "cekanti",
  sticker: "sticker",
  eye: "eye",
  ytmp3: "ytmp3",
  ytmp4: "ytmp4",
  tiktok: "tiktok",
  igdl: "igdl",
  toaudio: "toaudio",
  tts: "tts",
  quotely: "quotely",
  list: "list",
  addlist: "addlist",
  dellist: "dellist",
  resetlist: "resetlist",
  updatelist: "updatelist",
  brat: "brat",
  bratg: "bratg",
  // extra tools
  translate: "translate",
  cuaca: "cuaca",
  kamus: "kamus",
  qr: "qr",
  bmi: "bmi",
  kurs: "kurs",
  shortlink: "shortlink",
  ip: "ip",
  password: "password",
  meme: "meme",
  motivasi: "motivasi",
  ascii: "ascii",
  random: "random",
  siapa: "siapa",
  tagadmin: "tagadmin",
  tagme: "tagme",
  countmember: "countmember",
  // extras (hiburan)
  wiki: "wiki",
  pantun: "pantun",
  horoscope: "horoscope",
  suhu: "suhu",
  timer: "timer",
  trivia: "trivia",
  resep: "resep",
  tebakkata: "tebakkata",
  namabayi: "namabayi",
  cerita: "cerita",
  jadwalsholat: "jadwalsholat",
  gpt: "gpt",
  hangman: "hangman",
  hangmanstop: "hangmanstop",
  kata: "kata",
};

// Command yang BEBAS dipakai tanpa aktivasi
const freeCommands = ["aktif", "infobot", "help", "ping", "grupid"];

// ────────────────────────────────────────────
// HELPER
// ────────────────────────────────────────────

const logger = pino({ level: "silent" });

// ── Fungsi kirim kartu welcome ──
async function kirimKartuWelcome(sock, grupId, jid, nomor, data) {
  const { subject } = data;

  const kartu =
    `Selamat bergabung di\n` +
    `✨ *${subject}* ✨\n\n` +
    `Semoga betah & nyaman\n` +
    `di sini ya, jangan lupa berbaur! 🥰\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 Ketik *!help* untuk\n` +
    `   melihat perintah yerow\n` +
    `⚠️ Harap baca & patuhi\n` +
    `   peraturan grup `;

  await sock.sendMessage(grupId, {
    text: kartu,
    mentions: [jid],
  });
}

// ────────────────────────────────────────────
// START BOT
// ────────────────────────────────────────────

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: false,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    retryRequestDelayMs: 2000,
  });

  sock.ev.on("creds.update", saveCreds);

  // ── EVENT: Koneksi ──
  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 Scan QR berikut dengan WhatsApp kamu:\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(
        `❌ Koneksi terputus. Kode: ${code} | Reconnect: ${shouldReconnect}`,
      );
      if (shouldReconnect) {
        console.log("⏳ Reconnect dalam 5 detik...");
        setTimeout(() => startBot(), 5000);
      } else {
        console.log(
          "🚪 Logged out. Hapus folder auth_info lalu jalankan ulang.",
        );
      }
    }
    if (connection === "open") {
      console.log("✅ Bot berhasil terhubung!");
      console.log("ℹ️  Kirim !grupid di grup untuk mendapatkan ID grup.\n");
    }
  });

  // ── EVENT: Member baru / keluar ──
  sock.ev.on(
    "group-participants.update",
    async ({ id, participants, action }) => {
      if (config.grupId && id !== config.grupId) return;
      for (const jid of participants) {
        const nomor = jid.split("@")[0];

        if (action === "add") {
          tambahMember(jid, nomor);
          try {
            const meta = await sock.groupMetadata(id);

            await sock.sendMessage(id, {
              text:
                `👋 *Halo @${nomor}!* Selamat datang di *${meta.subject}* 🎉\n\n` +
                `Sertakan SS akun yang udah di cn, jangan lupa intro dulu yaaw!\n` +
                `Format intro *${meta.subject}* :\n\n` +
                `*Nama:*\n` +
                `*Asal Kota:*\n` +
                `*Umur:*\n` +
                `*Gender:*\n\n` +
                `> ⚠️PASTIKAN BACA PERATURAN, DAN SIAP ATAS SEMUA KONSEKUENSINYA\n`,
              mentions: [jid],
            });

            if (!global.waitingWelcome) global.waitingWelcome = {};
            global.waitingWelcome[jid] = {
              grupId: id,
              subject: meta.subject,
              timeout: setTimeout(
                async () => {
                  delete global.waitingWelcome[jid];
                  await kirimKartuWelcome(sock, id, jid, nomor, {
                    nama: `@${nomor}`,
                    kota: "—",
                    umur: "—",
                    gender: "—",
                    subject: meta.subject,
                  });
                },
                5 * 60 * 1000,
              ),
            };
          } catch {}
        }

        if (action === "remove") {
          await sock
            .sendMessage(id, {
              text:
                `🚪 *Bye bye, @${nomor}!*\n\n` +
                `Jangan balik lagi ya hama~ 👋😹\n`,
              mentions: [jid],
            })
            .catch(() => {});
        }
      }
    },
  );

  // ── EVENT: Pesan masuk ──
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      if (!from?.endsWith("@g.us")) continue;
      if (config.grupId && from !== config.grupId) continue;

      const pengirimJid = msg.key.participant || msg.key.remoteJid;
      const nomorPengirim = pengirimJid.split("@")[0];

      const isiPesan =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        "";

      const pesanLower = isiPesan.toLowerCase().trim();
      const mentionedJids =
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      // ── ANTI STORY ──
      if (await antiStory(sock, from, msg, pengirimJid)) continue;

      // Skip pesan sistem lainnya
      if (!msg.message) continue;

      // ── ANTI LINK ──
      if (await antiLink(sock, from, msg, pengirimJid, isiPesan)) continue;

      // ── ANTI BADWORDS ──
      if (await antiBadwords(sock, from, msg, pengirimJid, isiPesan)) continue;

      // ── MEDIA (sticker, eye, hd) ──
      if (await handleMedia(sock, from, msg, pengirimJid, isiPesan)) continue;

      // ── HANGMAN ──   ← HARUS ADA DI SINI
      if (
        global.hangmanState?.[from] &&
        isiPesan.length === 1 &&
        /^[a-zA-Z]$/.test(isiPesan)
      ) {
        const state = global.hangmanState[from];
        const huruf = isiPesan.toLowerCase();
        const gambarHangman = [
          " ___\n|   |\n|\n|\n|\n|___",
          " ___\n|   |\n|   O\n|\n|\n|___",
          " ___\n|   |\n|   O\n|   |\n|\n|___",
          " ___\n|   |\n|   O\n|  /|\n|\n|___",
          " ___\n|   |\n|   O\n|  /|\\\n|\n|___",
          " ___\n|   |\n|   O\n|  /|\\\n|  /\n|___",
          " ___\n|   |\n|   O\n|  /|\\\n|  / \\\n|___",
        ];

        if (state.tebakan.has(huruf)) {
          await sock.sendMessage(from, {
            text: `⚠️ Huruf *${huruf.toUpperCase()}* sudah pernah ditebak!`,
          });
          continue;
        }

        state.tebakan.add(huruf);
        const benar = state.kata.includes(huruf);
        if (!benar) state.nyawa--;

        const tampil = state.kata
          .split("")
          .map((h) => (state.tebakan.has(h) ? h : "_"))
          .join(" ");
        const sudahTebak = [...state.tebakan].join(", ");
        const menang = !tampil.includes("_");

        if (menang) {
          clearTimeout(state.timeout);
          delete global.hangmanState[from];
          await sock.sendMessage(from, {
            text: `🎉 *SELAMAT!*\n\n✅ Kata: *${state.kata}*\n❤️ Sisa nyawa: ${state.nyawa}`,
          });
        } else if (state.nyawa <= 0) {
          clearTimeout(state.timeout);
          const k = state.kata;
          delete global.hangmanState[from];
          await sock.sendMessage(from, {
            text: `\`\`\`\n${gambarHangman[6]}\n\`\`\`\n\n💀 *GAME OVER!*\nJawabannya: *${k}*`,
          });
        } else {
          await sock.sendMessage(from, {
            text:
              `\`\`\`\n${gambarHangman[6 - state.nyawa]}\n\`\`\`\n\n` +
              `${benar ? "✅ Huruf *" + huruf.toUpperCase() + "* ADA!" : "❌ Huruf *" + huruf.toUpperCase() + "* tidak ada!"}\n\n` +
              `📝 Kata: \`${tampil}\`\n` +
              `❤️ Nyawa: ${state.nyawa}\n` +
              `🔤 Ditebak: ${sudahTebak}`,
          });
        }
        continue;
      }

      // ── CEK BALASAN WELCOME ──
      if (global.waitingWelcome?.[pengirimJid]) {
        const state = global.waitingWelcome[pengirimJid];
        if (from === state.grupId) {
          const lines = isiPesan.split("\n");
          const getValue = (prefix) => {
            const line = lines.find((l) =>
              l.toLowerCase().includes(prefix.toLowerCase()),
            );
            return line ? line.split(":").slice(1).join(":").trim() : "—";
          };

          const nama = getValue("nama") || `@${nomorPengirim}`;
          const kota = getValue("kota") || "—";
          const umur = getValue("umur") || "—";
          const gender = getValue("gender") || "—";

          clearTimeout(state.timeout);
          delete global.waitingWelcome[pengirimJid];

          await kirimKartuWelcome(sock, from, pengirimJid, nomorPengirim, {
            nama,
            kota,
            umur,
            gender,
            subject: state.subject,
          });

          continue;
        }
      }

      // ── KEYWORD ──
      for (const [kata, balasan] of Object.entries(config.keywords)) {
        if (pesanLower.includes(kata)) {
          await sock.sendMessage(from, { text: balasan });
          break;
        }
      }

      // ── MENTION BOT ──
      const botJid = sock.user?.id?.split(":")[0];
      const isMentioned = mentionedJids.some((j) => j.includes(botJid));
      if (isMentioned && !pesanLower.startsWith(config.prefix)) {
        await sock.sendMessage(from, {
          text: `Halo @${nomorPengirim}! 👋\nKetik *!help* untuk daftar perintah.`,
          mentions: [pengirimJid],
        });
        continue;
      }

      // ── PREFIX COMMAND ──
      if (!pesanLower.startsWith(config.prefix)) continue;

      const parts = isiPesan.slice(config.prefix.length).trim().split(/\s+/);
      const commandRaw = parts[0].toLowerCase();
      const sisaArgs = parts.slice(1);
      const commandName = alias[commandRaw] || commandRaw;

      const handlerEntry = Object.entries(commands).find(
        ([key]) => key.toLowerCase() === commandName,
      );

      if (handlerEntry) {
        if (!freeCommands.includes(commandName) && !isGrupAktif(from)) {
          await sock.sendMessage(from, {
            text:
              `🔒 *Bot belum diaktivasi di grup ini!*\n\n` +
              `Ketik *!aktif [kode]* untuk mengaktifkan bot.\n` +
              `Hubungi owner untuk mendapatkan kode aktivasi.\n\n` +
              `📞 Owner: *${config.ownerNumber}*`,
          });
          continue;
        }
        try {
          await handlerEntry[1](
            sock,
            from,
            sisaArgs,
            pengirimJid,
            mentionedJids,
            msg,
          );
        } catch (err) {
          console.error(`[ERROR] command !${commandRaw}:`, err.message);
          await sock.sendMessage(from, {
            text: `❌ Error saat menjalankan *!${commandRaw}*.`,
          });
        }
      } else {
        await sock.sendMessage(from, {
          text: `❓ Perintah *!${commandRaw}* tidak dikenal.\nKetik *!help* untuk daftar perintah.`,
        });
      }
    }
  });

  // ── JADWAL CRON ──
  const kirim = (pesan) => {
    if (config.grupId)
      sock.sendMessage(config.grupId, { text: pesan }).catch(() => {});
  };

  for (const j of Object.values(config.jadwalHarian)) {
    cron.schedule(j.cron, () => kirim(j.pesan), { timezone: "Asia/Jakarta" });
  }
  for (const j of Object.values(config.jadwalMingguan)) {
    cron.schedule(j.cron, () => kirim(j.pesan), { timezone: "Asia/Jakarta" });
  }

  // Rekap absen otomatis jam 21.00 WIB
  cron.schedule(
    "0 21 * * *",
    async () => {
      if (!config.grupId) return;
      const hari = new Date().toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
      });
      const list = getAbsen(hari);
      const mentions = list.map((m) => m.jid);
      const isi =
        list.length === 0
          ? "_Tidak ada yang absen hari ini._"
          : list
              .map(
                (m, i) =>
                  `${i + 1}. @${m.jid.split("@")[0]} — ${m.waktu} (${m.keterangan})`,
              )
              .join("\n");
      await sock
        .sendMessage(config.grupId, {
          text: `📊 *Rekap Absen — ${hari}*\nTotal: *${list.length} orang*\n\n${isi}`,
          mentions,
        })
        .catch(() => {});
    },
    { timezone: "Asia/Jakarta" },
  );

  console.log("⏰ Jadwal cron aktif (WIB)");
}

startBot().catch(console.error);

// Jaga proses tetap hidup
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err?.message || err);
});
