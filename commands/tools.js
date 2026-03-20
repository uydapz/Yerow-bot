import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  unlinkSync,
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync, // ← tambah ini
} from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";

const FFMPEG = ffmpegStatic;
const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = join(__dirname, "../temp");
export default {
  // ── !translate [bahasa] [teks] ──
  translate: async (sock, from, args) => {
    const lang = args[0]?.toLowerCase();
    const teks = args.slice(1).join(" ");

    const langMap = {
      en: "Inggris",
      id: "Indonesia",
      ja: "Jepang",
      ko: "Korea",
      zh: "China",
      ar: "Arab",
      fr: "Prancis",
      de: "Jerman",
      es: "Spanyol",
    };

    if (!lang || !teks || !langMap[lang]) {
      await sock.sendMessage(from, {
        text:
          `🌐 *Translate*\n\n` +
          `Format: *!translate [kode bahasa] [teks]*\n\n` +
          `Kode bahasa:\n` +
          `\`en\` — Inggris\n\`id\` — Indonesia\n\`ja\` — Jepang\n` +
          `\`ko\` — Korea\n\`zh\` — China\n\`ar\` — Arab\n` +
          `\`fr\` — Prancis\n\`de\` — Jerman\n\`es\` — Spanyol\n\n` +
          `Contoh: *!translate en halo apa kabar*`,
      });
      return;
    }

    try {
      const fetch = (await import("node-fetch")).default;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(teks)}`;
      const res = await fetch(url);
      const data = await res.json();
      const hasil = data[0]?.map((x) => x[0]).join("") || "Gagal translate";
      await sock.sendMessage(from, {
        text: `🌐 *Translate → ${langMap[lang]}*\n\n*Input:* ${teks}\n*Output:* ${hasil}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal translate: ${e.message}`,
      });
    }
  },

  // ── !cuaca [kota] ──
  cuaca: async (sock, from, args) => {
    const kota = args.join(" ");
    if (!kota) {
      await sock.sendMessage(from, { text: "❌ Format: !cuaca Jakarta" });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(kota)}?format=j1`,
      );
      const data = await res.json();
      const cc = data.current_condition[0];
      const area = data.nearest_area[0];
      const namaKota = area.areaName[0].value;
      const negara = area.country[0].value;
      const suhu = cc.temp_C;
      const feels = cc.FeelsLikeC;
      const cuaca = cc.weatherDesc[0].value;
      const humidity = cc.humidity;
      const wind = cc.windspeedKmph;

      await sock.sendMessage(from, {
        text:
          `🌤️ *Cuaca ${namaKota}, ${negara}*\n\n` +
          `🌡️ Suhu: *${suhu}°C* (terasa ${feels}°C)\n` +
          `☁️ Kondisi: *${cuaca}*\n` +
          `💧 Kelembaban: *${humidity}%*\n` +
          `💨 Angin: *${wind} km/h*`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil cuaca: ${e.message}`,
      });
    }
  },

  // ── !kamus [kata] ──
  kamus: async (sock, from, args) => {
    const kata = args.join(" ").toLowerCase().trim();
    if (!kata) {
      await sock.sendMessage(from, { text: "❌ Format: !kamus serendipity" });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(kata)}`,
      );
      if (!res.ok) throw new Error("Kata tidak ditemukan");
      const data = await res.json();
      const entry = data[0];
      const phonetic = entry.phonetic || "";
      const meanings = entry.meanings
        .slice(0, 2)
        .map((m) => {
          const def = m.definitions[0].definition;
          const ex = m.definitions[0].example
            ? `\n   _"${m.definitions[0].example}"_`
            : "";
          return `📚 *${m.partOfSpeech}*\n   ${def}${ex}`;
        })
        .join("\n\n");

      await sock.sendMessage(from, {
        text: `📖 *${kata}* ${phonetic}\n\n${meanings}`,
      });
    } catch {
      await sock.sendMessage(from, {
        text: `❌ Kata *"${kata}"* tidak ditemukan di kamus.`,
      });
    }
  },

  // ── !qr [teks/url] — buat QR code ──
  qr: async (sock, from, args) => {
    const teks = args.join(" ").trim();
    if (!teks) {
      await sock.sendMessage(from, {
        text: "❌ Format: !qr [teks atau URL]\nContoh: !qr https://google.com",
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(teks)}`;
      const res = await fetch(url);
      const buffer = await res.buffer();
      await sock.sendMessage(from, {
        image: buffer,
        caption: `✅ *QR Code dibuat!*\nData: ${teks}`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal buat QR: ${e.message}` });
    }
  },

  // ── !bmi [berat] [tinggi] — hitung BMI ──
  bmi: async (sock, from, args) => {
    const berat = parseFloat(args[0]);
    const tinggi = parseFloat(args[1]);
    if (isNaN(berat) || isNaN(tinggi)) {
      await sock.sendMessage(from, {
        text: "❌ Format: !bmi [berat kg] [tinggi cm]\nContoh: !bmi 65 170",
      });
      return;
    }
    const tinggiM = tinggi / 100;
    const bmi = (berat / (tinggiM * tinggiM)).toFixed(1);
    let kategori, emoji;
    if (bmi < 18.5) {
      kategori = "Kurus";
      emoji = "😟";
    } else if (bmi < 25) {
      kategori = "Normal";
      emoji = "😊";
    } else if (bmi < 30) {
      kategori = "Gemuk";
      emoji = "😐";
    } else {
      kategori = "Obesitas";
      emoji = "😰";
    }

    await sock.sendMessage(from, {
      text:
        `⚖️ *Kalkulator BMI*\n\n` +
        `👤 Berat: ${berat} kg\n` +
        `📏 Tinggi: ${tinggi} cm\n\n` +
        `📊 BMI: *${bmi}*\n` +
        `${emoji} Kategori: *${kategori}*`,
    });
  },

  // ── !kurs [mata uang] — kurs ke IDR ──
  kurs: async (sock, from, args) => {
    const mata = (args[0] || "USD").toUpperCase();
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${mata}`,
      );
      if (!res.ok) throw new Error("Mata uang tidak valid");
      const data = await res.json();
      const idr = data.rates.IDR?.toLocaleString("id-ID") || "N/A";
      const usd = data.rates.USD?.toFixed(4) || "N/A";
      const sgd = data.rates.SGD?.toFixed(4) || "N/A";
      const myr = data.rates.MYR?.toFixed(4) || "N/A";

      await sock.sendMessage(from, {
        text:
          `💱 *Kurs ${mata} (${new Date().toLocaleDateString("id-ID")})*\n\n` +
          `🇮🇩 IDR: Rp ${idr}\n` +
          `🇺🇸 USD: $${usd}\n` +
          `🇸🇬 SGD: S$${sgd}\n` +
          `🇲🇾 MYR: RM${myr}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil kurs: ${e.message}`,
      });
    }
  },

  // ── !shortlink [url] — perpendek URL ──
  shortlink: async (sock, from, args) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) {
      await sock.sendMessage(from, {
        text: "❌ Format: !shortlink [URL]\nContoh: !shortlink https://google.com",
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      );
      const short = await res.text();
      await sock.sendMessage(from, {
        text: `🔗 *URL Diperpendek*\n\n*Asli:* ${url}\n*Pendek:* ${short}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal perpendek URL: ${e.message}`,
      });
    }
  },

  // ── !ip [alamat ip] — info IP ──
  ip: async (sock, from, args) => {
    const alamat = args[0] || "";
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(`https://ipapi.co/${alamat}/json/`);
      const data = await res.json();
      if (data.error) throw new Error(data.reason);
      await sock.sendMessage(from, {
        text:
          `🌐 *Info IP: ${data.ip}*\n\n` +
          `🏳️ Negara: ${data.country_name} ${data.country_code}\n` +
          `🏙️ Kota: ${data.city}\n` +
          `📡 ISP: ${data.org}\n` +
          `🕐 Timezone: ${data.timezone}\n` +
          `📍 Koordinat: ${data.latitude}, ${data.longitude}`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal cek IP: ${e.message}` });
    }
  },

  // ── !password [panjang] — generate password acak ──
  password: async (sock, from, args) => {
    const panjang = Math.min(Math.max(parseInt(args[0]) || 12, 6), 32);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < panjang; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    await sock.sendMessage(from, {
      text: `🔐 *Password Generated (${panjang} karakter)*\n\n\`${pass}\`\n\n_Jangan share ke siapapun!_`,
    });
  },

  // ── !meme — kirim meme random ──
  meme: async (sock, from) => {
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch("https://meme-api.com/gimme");
      const data = await res.json();
      if (!data.url) throw new Error("No meme found");
      const imgRes = await fetch(data.url);
      const buffer = await imgRes.buffer();
      await sock.sendMessage(from, {
        image: buffer,
        caption: `😂 *${data.title}*\n👍 ${data.ups} upvotes | r/${data.subreddit}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil meme: ${e.message}`,
      });
    }
  },

  // ── !motivasi — kirim motivasi random ──
  motivasi: async (sock, from) => {
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch("https://zenquotes.io/api/random");
      const data = await res.json();
      const quote = data[0];
      await sock.sendMessage(from, {
        text: `💪 *Motivasi Hari Ini*\n\n_"${quote.q}"_\n\n— *${quote.a}*`,
      });
    } catch {
      const quotes = [
        "Jangan menyerah, setiap hari adalah kesempatan baru.",
        "Keberhasilan adalah perjalanan, bukan tujuan.",
        "Percayalah pada prosesmu sendiri.",
      ];
      await sock.sendMessage(from, {
        text: `💪 *Motivasi Hari Ini*\n\n_"${quotes[Math.floor(Math.random() * quotes.length)]}"_`,
      });
    }
  },

  // ── !kata [huruf] — kata acak dari huruf ──
  kata: async (sock, from, args) => {
    const huruf = args[0]?.toLowerCase();
    if (!huruf || huruf.length !== 1) {
      await sock.sendMessage(from, {
        text: "❌ Format: !kata [huruf]\nContoh: !kata a",
      });
      return;
    }
    const kataList = {
      a: [
        "apel",
        "ayam",
        "angin",
        "awan",
        "akar",
        "alam",
        "api",
        "air",
        "anak",
        "abadi",
      ],
      b: [
        "bunga",
        "buku",
        "burung",
        "batu",
        "bulan",
        "bintang",
        "bahasa",
        "bangsa",
        "bumi",
        "bahagia",
      ],
      c: [
        "cinta",
        "cahaya",
        "cermin",
        "cuaca",
        "ceria",
        "cantik",
        "cerdas",
        "cipta",
        "cakap",
        "canda",
      ],
      d: [
        "daun",
        "danau",
        "doa",
        "dewa",
        "diam",
        "damai",
        "darat",
        "dekat",
        "dunia",
        "dalam",
      ],
      e: [
        "elang",
        "embun",
        "emas",
        "entah",
        "era",
        "erat",
        "esok",
        "enak",
        "ekspresi",
        "energi",
      ],
      f: [
        "fakta",
        "fajar",
        "fantasi",
        "filosofi",
        "fokus",
        "forum",
        "fungsi",
        "formal",
        "fasih",
        "fitrah",
      ],
      g: [
        "gembira",
        "gelap",
        "gunung",
        "gagah",
        "galak",
        "gerak",
        "gambar",
        "gadis",
        "gaya",
        "gulungan",
      ],
      h: [
        "harapan",
        "hutan",
        "hujan",
        "harmoni",
        "halus",
        "hangat",
        "hebat",
        "hidup",
        "hijau",
        "hati",
      ],
      i: [
        "indah",
        "ikhlas",
        "ilmu",
        "iman",
        "impian",
        "insan",
        "istana",
        "irama",
        "inspirasi",
        "inti",
      ],
      j: [
        "jalan",
        "jiwa",
        "jujur",
        "jagad",
        "jernih",
        "janji",
        "jasa",
        "jaya",
        "jambu",
        "julang",
      ],
      k: [
        "kasih",
        "kuat",
        "karya",
        "kilat",
        "kota",
        "kata",
        "kereta",
        "kawan",
        "kebun",
        "kenangan",
      ],
      l: [
        "langit",
        "laut",
        "lembut",
        "logika",
        "lelah",
        "lurus",
        "lafal",
        "lega",
        "luhur",
        "lancar",
      ],
      m: [
        "matahari",
        "mimpi",
        "murni",
        "mulia",
        "mekar",
        "maju",
        "mawar",
        "mahkota",
        "malam",
        "manusia",
      ],
      n: [
        "nyata",
        "nada",
        "nafas",
        "negeri",
        "nikmat",
        "nurani",
        "nama",
        "niat",
        "nestapa",
        "nilam",
      ],
      o: [
        "obor",
        "ombak",
        "otak",
        "optimis",
        "olah",
        "omega",
        "orde",
        "orasi",
        "orkes",
        "obat",
      ],
      p: [
        "pagi",
        "pantai",
        "pohon",
        "pelangi",
        "puncak",
        "putih",
        "pikir",
        "percaya",
        "pahlawan",
        "perdana",
      ],
      q: ["qalbu", "qari", "quran", "qudrat", "qalam"],
      r: [
        "rindu",
        "rasa",
        "ruang",
        "rahmat",
        "riang",
        "rindang",
        "rajin",
        "rendah",
        "rela",
        "rembulan",
      ],
      s: [
        "sinar",
        "surya",
        "senyum",
        "sejuk",
        "semangat",
        "setia",
        "syukur",
        "sabda",
        "suara",
        "sabar",
      ],
      t: [
        "tegar",
        "teduh",
        "terang",
        "tulus",
        "tanah",
        "tunas",
        "takdir",
        "teman",
        "tenang",
        "tinggi",
      ],
      u: [
        "udara",
        "ulama",
        "umat",
        "umpama",
        "ungkap",
        "utama",
        "unik",
        "usaha",
        "ujian",
        "ufuk",
      ],
      v: [
        "visi",
        "vaksin",
        "variasi",
        "vokal",
        "vital",
        "nilai",
        "volume",
        "versi",
        "valid",
        "vibran",
      ],
      w: [
        "waktu",
        "warna",
        "wajah",
        "warga",
        "warisan",
        "wibawa",
        "wijak",
        "windu",
        "wirama",
        "wahyu",
      ],
      x: ["xenial", "xylem", "xilofon"],
      y: [
        "yakin",
        "yang",
        "yakni",
        "yatim",
        "yudha",
        "yuran",
        "yuana",
        "yugas",
        "yogi",
        "yunan",
      ],
      z: [
        "zakat",
        "zaman",
        "zalim",
        "zanur",
        "zarrah",
        "ziarah",
        "zodiak",
        "zona",
        "zuhud",
        "zuriat",
      ],
    };
    const list = kataList[huruf] || ["tidak ada data untuk huruf ini"];
    const kata = list[Math.floor(Math.random() * list.length)];
    await sock.sendMessage(from, {
      text: `🔤 *Kata acak dari huruf "${huruf.toUpperCase()}"*\n\n📝 ${kata}`,
    });
  },

  // ── !siapa — pilih member ngacak ──
  siapa: async (sock, from, args) => {
    try {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.filter((p) => !p.admin);
      if (members.length === 0) {
        await sock.sendMessage(from, {
          text: "❌ Tidak ada member biasa di grup.",
        });
        return;
      }
      const terpilih = members[Math.floor(Math.random() * members.length)];
      const nomor = terpilih.id.split("@")[0].split(":")[0];
      const pertanyaan = args.join(" ") || "yang terpilih secara acak";
      await sock.sendMessage(from, {
        text: `🎯 *Siapa ${pertanyaan}?*\n\nJawabannya adalah... @${nomor}! 🎉`,
        mentions: [terpilih.id],
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  // ── !hitung2 (alias) ──
  kalkulator: async (sock, from, args) => {
    const ekspresi = args.join(" ").replace(/[^0-9+\-*/().% ]/g, "");
    if (!ekspresi) {
      await sock.sendMessage(from, {
        text: "❌ Format: !kalkulator 10 + 5 * 2",
      });
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

  // ── !ascii [teks] — ubah teks ke ASCII art ──
  ascii: async (sock, from, args) => {
    const teks = args.join(" ").toUpperCase().trim();
    if (!teks || teks.length > 10) {
      await sock.sendMessage(from, {
        text: "❌ Format: !ascii [teks max 10 karakter]\nContoh: !ascii HALO",
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://artii.herokuapp.com/make?text=${encodeURIComponent(teks)}`,
      );
      const art = await res.text();
      await sock.sendMessage(from, { text: `\`\`\`${art}\`\`\`` });
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal buat ASCII art." });
    }
  },

  // ── !random [min] [max] — angka acak ──
  random: async (sock, from, args) => {
    const min = parseInt(args[0]) || 1;
    const max = parseInt(args[1]) || 100;
    if (min >= max) {
      await sock.sendMessage(from, {
        text: "❌ Format: !random [min] [max]\nContoh: !random 1 100",
      });
      return;
    }
    const hasil = Math.floor(Math.random() * (max - min + 1)) + min;
    await sock.sendMessage(from, {
      text: `🎲 *Angka Acak*\n\nRange: ${min} - ${max}\nHasil: *${hasil}*`,
    });
  },

  // ── !tagadmin — tag semua admin ──
  tagadmin: async (sock, from) => {
    try {
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter((p) => p.admin);
      if (admins.length === 0) {
        await sock.sendMessage(from, { text: "❌ Tidak ada admin di grup." });
        return;
      }
      const mentions = admins.map((a) => a.id);
      const tags = admins
        .map((a) => `@${a.id.split("@")[0].split(":")[0]}`)
        .join(" ");
      await sock.sendMessage(from, {
        text: `📢 *Tag Admin*\n\n${tags}`,
        mentions,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  // ── !ceklink [url] — cek apakah URL aman ──
  ceklink: async (sock, from, args) => {
    const url = args[0];
    if (!url || !url.startsWith("http")) {
      await sock.sendMessage(from, {
        text: "❌ Format: !ceklink [URL]\nContoh: !ceklink https://google.com",
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyD-invalid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: { clientId: "bot", clientVersion: "1.0" },
            threatInfo: {
              threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url }],
            },
          }),
        },
      );
      const data = await res.json();
      const aman = !data.matches || data.matches.length === 0;
      await sock.sendMessage(from, {
        text: `🔍 *Cek Link*\n\nURL: ${url}\nStatus: ${aman ? "✅ Aman" : "⚠️ Mencurigakan!"}`,
      });
    } catch {
      // Fallback: cek panjang & format saja
      const mencurigakan =
        url.includes("bit.ly") || url.includes("tinyurl") || url.length > 200;
      await sock.sendMessage(from, {
        text: `🔍 *Cek Link*\n\nURL: ${url}\nStatus: ${mencurigakan ? "⚠️ Perlu dicek manual" : "✅ Terlihat normal"}`,
      });
    }
  },

  // ── !tagme — bot tag diri sendiri ──
  tagme: async (sock, from, args, pengirimJid) => {
    const nomor = pengirimJid.split("@")[0].split(":")[0];
    await sock.sendMessage(from, {
      text: `👋 Hai @${nomor}! Bot menyapamu~ ✨`,
      mentions: [pengirimJid],
    });
  },

  // ── !countmember — hitung member grup ──
  countmember: async (sock, from) => {
    try {
      const meta = await sock.groupMetadata(from);
      const total = meta.participants.length;
      const admin = meta.participants.filter((p) => p.admin).length;
      const biasa = total - admin;
      await sock.sendMessage(from, {
        text:
          `👥 *Jumlah Member*\n\n` +
          `Total: *${total} orang*\n` +
          `🛡️ Admin: ${admin} orang\n` +
          `👤 Member: ${biasa} orang`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  // ── EXTRA TOOLS ──

  translate: async (sock, from, args) => {
    const lang = args[0]?.toLowerCase();
    const teks = args.slice(1).join(" ");
    const langMap = {
      en: "Inggris",
      id: "Indonesia",
      ja: "Jepang",
      ko: "Korea",
      zh: "China",
      ar: "Arab",
      fr: "Prancis",
      de: "Jerman",
      es: "Spanyol",
    };
    if (!lang || !teks || !langMap[lang]) {
      await sock.sendMessage(from, {
        text: `🌐 *Translate*\nFormat: *!translate [kode] [teks]*\n\nKode: en id ja ko zh ar fr de es\nContoh: *!translate en halo apa kabar*`,
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(teks)}`;
      const res = await fetch(url);
      const data = await res.json();
      const hasil = data[0]?.map((x) => x[0]).join("") || "Gagal";
      await sock.sendMessage(from, {
        text: `🌐 *Translate → ${langMap[lang]}*\n\n*Input:* ${teks}\n*Output:* ${hasil}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal translate: ${e.message}`,
      });
    }
  },

  cuaca: async (sock, from, args) => {
    const kota = args.join(" ").trim();
    if (!kota) {
      await sock.sendMessage(from, { text: "❌ Format: !cuaca Malang" });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;

      // Step 1: Geocoding — cari koordinat kota
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id&countryCode=ID`,
      );
      const geoData = await geoRes.json();

      if (!geoData.results?.length) {
        await sock.sendMessage(from, {
          text: `❌ Kota *"${kota}"* tidak ditemukan.`,
        });
        return;
      }

      const { latitude, longitude, name, admin1 } = geoData.results[0];

      // Step 2: Ambil cuaca berdasarkan koordinat
      const cuacaRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FJakarta`,
      );
      const cuacaData = await cuacaRes.json();
      const c = cuacaData.current;

      // Mapping kode cuaca ke deskripsi
      const kodeCuaca = {
        0: "☀️ Cerah",
        1: "🌤️ Sebagian cerah",
        2: "⛅ Berawan",
        3: "☁️ Mendung",
        45: "🌫️ Berkabut",
        48: "🌫️ Berkabut beku",
        51: "🌦️ Gerimis ringan",
        53: "🌦️ Gerimis",
        55: "🌧️ Gerimis lebat",
        61: "🌧️ Hujan ringan",
        63: "🌧️ Hujan",
        65: "🌧️ Hujan lebat",
        80: "🌦️ Hujan lokal",
        81: "🌧️ Hujan deras lokal",
        82: "⛈️ Hujan sangat deras",
        95: "⛈️ Badai petir",
        96: "⛈️ Badai + hujan es",
      };
      const kondisi = kodeCuaca[c.weather_code] || "🌡️ Tidak diketahui";

      await sock.sendMessage(from, {
        text:
          `🌤️ *Cuaca ${name}, ${admin1 || "Indonesia"}*\n\n` +
          `🌡️ Suhu: *${c.temperature_2m}°C* (terasa ${c.apparent_temperature}°C)\n` +
          `☁️ Kondisi: *${kondisi}*\n` +
          `💧 Kelembaban: *${c.relative_humidity_2m}%*\n` +
          `💨 Angin: *${c.wind_speed_10m} km/h*`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil cuaca: ${e.message}`,
      });
    }
  },

  kamus: async (sock, from, args) => {
    const kata = args.join(" ").toLowerCase().trim();
    if (!kata) {
      await sock.sendMessage(from, {
        text: "❌ Format: !kamus [kata bahasa Inggris]",
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(kata)}`,
      );
      if (!res.ok) throw new Error("tidak ditemukan");
      const data = await res.json();
      const entry = data[0];
      const meanings = entry.meanings
        .slice(0, 2)
        .map((m) => `📚 *${m.partOfSpeech}*\n   ${m.definitions[0].definition}`)
        .join("\n\n");
      await sock.sendMessage(from, {
        text: `📖 *${entry.word}* ${entry.phonetic || ""}\n\n${meanings}`,
      });
    } catch {
      await sock.sendMessage(from, {
        text: `❌ Kata *"${kata}"* tidak ditemukan.`,
      });
    }
  },

  qr: async (sock, from, args) => {
    const teks = args.join(" ").trim();
    if (!teks) {
      await sock.sendMessage(from, { text: "❌ Format: !qr [teks/url]" });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(teks)}`,
      );
      const buffer = await res.buffer();
      await sock.sendMessage(from, {
        image: buffer,
        caption: `✅ *QR Code*\nData: ${teks}`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal buat QR: ${e.message}` });
    }
  },

  bmi: async (sock, from, args) => {
    const berat = parseFloat(args[0]);
    const tinggi = parseFloat(args[1]);
    if (isNaN(berat) || isNaN(tinggi)) {
      await sock.sendMessage(from, {
        text: "❌ Format: !bmi [berat kg] [tinggi cm]\nContoh: !bmi 65 170",
      });
      return;
    }
    const bmi = (berat / Math.pow(tinggi / 100, 2)).toFixed(1);
    const kat =
      bmi < 18.5
        ? "😟 Kurus"
        : bmi < 25
          ? "😊 Normal"
          : bmi < 30
            ? "😐 Gemuk"
            : "😰 Obesitas";
    await sock.sendMessage(from, {
      text: `⚖️ *Kalkulator BMI*\n\n👤 Berat: ${berat}kg | Tinggi: ${tinggi}cm\n📊 BMI: *${bmi}*\n${kat}`,
    });
  },

  kurs: async (sock, from, args) => {
    const mata = (args[0] || "USD").toUpperCase();
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${mata}`,
      );
      if (!res.ok) throw new Error("Mata uang tidak valid");
      const data = await res.json();
      await sock.sendMessage(from, {
        text:
          `💱 *Kurs ${mata}*\n\n` +
          `🇮🇩 IDR: Rp ${data.rates.IDR?.toLocaleString("id-ID")}\n` +
          `🇺🇸 USD: $${data.rates.USD?.toFixed(4)}\n` +
          `🇸🇬 SGD: S$${data.rates.SGD?.toFixed(4)}\n` +
          `🇲🇾 MYR: RM${data.rates.MYR?.toFixed(4)}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil kurs: ${e.message}`,
      });
    }
  },

  shortlink: async (sock, from, args) => {
    const url = args[0];
    if (!url?.startsWith("http")) {
      await sock.sendMessage(from, { text: "❌ Format: !shortlink [URL]" });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      );
      const short = await res.text();
      await sock.sendMessage(from, {
        text: `🔗 *Perpendek URL*\n\nAsli: ${url}\nPendek: ${short}`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  ip: async (sock, from, args) => {
    const alamat = args[0] || "";
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(`https://ipapi.co/${alamat}/json/`);
      const d = await res.json();
      if (d.error) throw new Error(d.reason);
      await sock.sendMessage(from, {
        text:
          `🌐 *Info IP: ${d.ip}*\n\n` +
          `🏳️ Negara: ${d.country_name}\n🏙️ Kota: ${d.city}\n` +
          `📡 ISP: ${d.org}\n🕐 Timezone: ${d.timezone}`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal cek IP: ${e.message}` });
    }
  },

  password: async (sock, from, args) => {
    const panjang = Math.min(Math.max(parseInt(args[0]) || 12, 6), 32);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < panjang; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    await sock.sendMessage(from, {
      text: `🔐 *Password (${panjang} karakter)*\n\n\`${pass}\`\n\n_Jangan share ke siapapun!_`,
    });
  },

  meme: async (sock, from) => {
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch("https://meme-api.com/gimme");
      const data = await res.json();
      const imgRes = await fetch(data.url);
      const buffer = await imgRes.buffer();
      await sock.sendMessage(from, {
        image: buffer,
        caption: `😂 *${data.title}*\n👍 ${data.ups} | r/${data.subreddit}`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil meme: ${e.message}`,
      });
    }
  },

  motivasi: async (sock, from) => {
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch("https://zenquotes.io/api/random");
      const data = await res.json();
      await sock.sendMessage(from, {
        text: `💪 *Motivasi*\n\n_"${data[0].q}"_\n\n— *${data[0].a}*`,
      });
    } catch {
      const list = [
        "Jangan menyerah, setiap hari adalah kesempatan baru.",
        "Percayalah pada prosesmu sendiri.",
        "Keberhasilan dimulai dari langkah pertama.",
      ];
      await sock.sendMessage(from, {
        text: `💪 *Motivasi*\n\n_"${list[Math.floor(Math.random() * list.length)]}"_`,
      });
    }
  },

  ascii: async (sock, from, args) => {
    const teks = args.join(" ").toUpperCase().trim();
    if (!teks || teks.length > 10) {
      await sock.sendMessage(from, {
        text: "❌ Format: !ascii [teks max 10 huruf]\nContoh: !ascii HALO",
      });
      return;
    }
    try {
      const figlet = (await import("figlet")).default;
      const art = await new Promise((resolve, reject) => {
        figlet(teks, { font: "Big" }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      await sock.sendMessage(from, {
        text: `✨ *ASCII Art*\n\n\`\`\`\n${art}\n\`\`\``,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal buat ASCII art: ${e.message}`,
      });
    }
  },

  random: async (sock, from, args) => {
    const min = parseInt(args[0]) || 1;
    const max = parseInt(args[1]) || 100;
    if (min >= max) {
      await sock.sendMessage(from, {
        text: "❌ Format: !random [min] [max]\nContoh: !random 1 100",
      });
      return;
    }
    const hasil = Math.floor(Math.random() * (max - min + 1)) + min;
    await sock.sendMessage(from, {
      text: `🎲 *Angka Acak*\nRange: ${min}–${max}\nHasil: *${hasil}*`,
    });
  },

  siapa: async (sock, from, args) => {
    try {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.filter((p) => !p.admin);
      if (!members.length) {
        await sock.sendMessage(from, { text: "❌ Tidak ada member biasa." });
        return;
      }
      const terpilih = members[Math.floor(Math.random() * members.length)];
      const nomor = terpilih.id.split("@")[0].split(":")[0];
      const pertanyaan = args.join(" ") || "yang terpilih";
      await sock.sendMessage(from, {
        text: `🎯 *Siapa ${pertanyaan}?*\n\nJawabannya... @${nomor}! 🎉`,
        mentions: [terpilih.id],
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  tagadmin: async (sock, from) => {
    try {
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter((p) => p.admin);
      if (!admins.length) {
        await sock.sendMessage(from, { text: "❌ Tidak ada admin." });
        return;
      }
      const mentions = admins.map((a) => a.id);
      const tags = admins
        .map((a) => `@${a.id.split("@")[0].split(":")[0]}`)
        .join(" ");
      await sock.sendMessage(from, {
        text: `📢 *Tag Admin*\n\n${tags}`,
        mentions,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  tagme: async (sock, from, args, pengirimJid) => {
    const nomor = pengirimJid.split("@")[0].split(":")[0];
    await sock.sendMessage(from, {
      text: `👋 Hai @${nomor}! ✨`,
      mentions: [pengirimJid],
    });
  },

  countmember: async (sock, from) => {
    try {
      const meta = await sock.groupMetadata(from);
      const total = meta.participants.length;
      const admin = meta.participants.filter((p) => p.admin).length;
      await sock.sendMessage(from, {
        text: `👥 *Jumlah Member*\n\nTotal: *${total} orang*\n🛡️ Admin: ${admin}\n👤 Member: ${total - admin}`,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal: ${e.message}` });
    }
  },

  toaudio: async (sock, from, args, pengirimJid, mentionedJids, msg) => {
    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedVideo = quotedMsg?.videoMessage;
    const isVideo = msg.message?.videoMessage;
    if (!quotedVideo && !isVideo) {
      await sock.sendMessage(from, {
        text: `🎵 *!toaudio*\n\n• Kirim video dengan caption *!toaudio*\n• Atau reply video lalu ketik *!toaudio*`,
      });
      return;
    }
    await sock.sendMessage(from, { text: "⏳ Mengkonversi ke audio..." });
    const { unlinkSync, readFileSync, existsSync, writeFileSync } =
      await import("fs");
    const { join } = await import("path");
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const ffmpegStatic = (await import("ffmpeg-static")).default;
    const { downloadMediaMessage } = await import("@whiskeysockets/baileys");
    const execFileAsync = promisify(execFile);
    const TEMP_DIR = join(process.cwd(), "temp");
    const inPath = join(TEMP_DIR, `toaudio_in_${Date.now()}`);
    const outPath = join(TEMP_DIR, `toaudio_out_${Date.now()}.mp3`);
    try {
      const mediaBuffer = isVideo
        ? await downloadMediaMessage(msg, "buffer", {})
        : await downloadMediaMessage(
            { key: msg.key, message: quotedMsg },
            "buffer",
            {},
          );
      writeFileSync(inPath, mediaBuffer);
      await execFileAsync(ffmpegStatic, [
        "-i",
        inPath,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-q:a",
        "2",
        outPath,
      ]);
      const buffer = readFileSync(outPath);
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: false,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal konversi: ${e.message}` });
    } finally {
      try {
        unlinkSync(inPath);
      } catch {}
      try {
        unlinkSync(outPath);
      } catch {}
    }
  },

  tts: async (sock, from, args) => {
    const teks = args.join(" ").trim();
    if (!teks) {
      await sock.sendMessage(from, {
        text: `🔊 *!tts [teks]*\n\nContoh: \`!tts Halo semuanya\``,
      });
      return;
    }
    if (teks.length > 200) {
      await sock.sendMessage(from, {
        text: `❌ Teks terlalu panjang. Maksimal 200 karakter.`,
      });
      return;
    }
    await sock.sendMessage(from, { text: "⏳ Membuat suara..." });
    const { readFileSync, existsSync, unlinkSync } = await import("fs");
    const { join } = await import("path");
    const gtts = (await import("gtts")).default;
    const outPath = join(process.cwd(), "temp", `tts_${Date.now()}.mp3`);
    try {
      await new Promise((resolve, reject) => {
        const t = new gtts(teks, "id");
        t.save(outPath, (err) => (err ? reject(err) : resolve()));
      });
      const buffer = readFileSync(outPath);
      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: true,
      });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Gagal buat TTS: ${e.message}` });
    } finally {
      try {
        if (existsSync(outPath)) unlinkSync(outPath);
      } catch {}
    }
  },

  quotely: async (sock, from, args, pengirimJid, mentionedJids, msg) => {
    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText =
      quotedMsg?.conversation ||
      quotedMsg?.extendedTextMessage?.text ||
      args.join(" ").trim();
    if (!quotedText) {
      await sock.sendMessage(from, {
        text: `🖼️ *!quotely*\n\n• Reply pesan lalu ketik *!quotely*\n• Atau ketik *!quotely [teks]*`,
      });
      return;
    }
    await sock.sendMessage(from, { text: "⏳ Membuat gambar quote..." });
    const { existsSync, unlinkSync } = await import("fs");
    const { join } = await import("path");
    const { default: fetch } = await import("node-fetch");
    const outPath = join(process.cwd(), "temp", `quotely_${Date.now()}.png`);
    try {
      const { createCanvas, loadImage } = await import("canvas");
      const W = 900,
        H = 500;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      // Background
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0f0c29");
      bg.addColorStop(0.5, "#302b63");
      bg.addColorStop(1, "#24243e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Tanda kutip
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font = "220px Georgia";
      ctx.fillText(`"`, 30, 220);

      // Garis aksen kiri
      const lineGrad = ctx.createLinearGradient(0, 80, 0, H - 80);
      lineGrad.addColorStop(0, "rgba(233,69,96,0)");
      lineGrad.addColorStop(0.5, "#e94560");
      lineGrad.addColorStop(1, "rgba(233,69,96,0)");
      ctx.fillStyle = lineGrad;
      ctx.fillRect(55, 80, 3, H - 160);

      // Teks quote
      ctx.fillStyle = "#ffffff";
      ctx.font = "300 26px Sans";
      ctx.textBaseline = "middle";
      const words = quotedText.split(" ");
      let line = "";
      const lines = [];
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > 620 && line !== "") {
          lines.push(line.trim());
          line = word + " ";
        } else line = test;
      }
      lines.push(line.trim());
      const display = lines.slice(0, 6);
      if (lines.length > 6) display[5] += "...";
      let y = H / 2 - ((display.length - 1) * 44) / 2 - 30;
      for (const l of display) {
        ctx.fillText(l, 80, y);
        y += 44;
      }

      // Divider
      const divGrad = ctx.createLinearGradient(80, 0, W - 80, 0);
      divGrad.addColorStop(0, "rgba(255,255,255,0)");
      divGrad.addColorStop(0.5, "rgba(255,255,255,0.2)");
      divGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = divGrad;
      ctx.fillRect(80, H - 110, W - 160, 1);

      // Foto profil
      const senderJid =
        msg.message?.extendedTextMessage?.contextInfo?.participant ||
        pengirimJid;
      const nomorSender = senderJid.split("@")[0].split(":")[0];
      const ppSize = 52,
        ppX = 90,
        ppY = H - 85;
      let ppLoaded = false;
      try {
        const ppUrl = await sock.profilePictureUrl(senderJid, "image");
        const ppRes = await fetch(ppUrl);
        const ppBuf = Buffer.from(await ppRes.arrayBuffer());
        const ppImg = await loadImage(ppBuf);
        ctx.save();
        ctx.beginPath();
        ctx.arc(ppX + ppSize / 2, ppY + ppSize / 2, ppSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#e94560";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(ppImg, ppX, ppY, ppSize, ppSize);
        ctx.restore();
        ppLoaded = true;
      } catch {}

      if (!ppLoaded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ppX + ppSize / 2, ppY + ppSize / 2, ppSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#e94560";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px Sans";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(
          nomorSender[0].toUpperCase(),
          ppX + ppSize / 2,
          ppY + ppSize / 2,
        );
        ctx.restore();
        ctx.textAlign = "left";
      }

      // Nama pengirim
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Sans";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "13px Sans";
      ctx.fillText("via Yerow's Bot", ppX + ppSize + 12, ppY + ppSize / 2 + 12);

      // Watermark
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "14px Sans";
      ctx.textBaseline = "middle";
      ctx.fillText("✦ Yerow's Bot", W - 130, H - 60);

      const imgBuffer = canvas.toBuffer("image/png");
      await sock.sendMessage(from, {
        image: imgBuffer,
        caption: `🖼️ _"${quotedText.slice(0, 60)}${quotedText.length > 60 ? "..." : ""}"_`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal buat quote: ${e.message}`,
      });
    } finally {
      try {
        if (existsSync(outPath)) unlinkSync(outPath);
      } catch {}
    }
  },

  brat: async (sock, from, args, pengirimJid, mentionedJids, msg) => {
    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const teks =
      args.join(" ").trim() ||
      quotedMsg?.conversation ||
      quotedMsg?.extendedTextMessage?.text ||
      "";

    if (!teks) {
      await sock.sendMessage(from, {
        text: `🎨 *!squote [teks]*\n\n• Ketik *!squote teks kamu*\n• Atau reply pesan lalu ketik *!squote*`,
      });
      return;
    }

    try {
      const puppeteer = (await import("puppeteer-core")).default;
      const sharp = (await import("sharp")).default;

      // Cari chrome/edge yang terinstall di Windows
      const executablePath =
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

      const browser = await puppeteer.launch({
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "new",
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 512, height: 512 });

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 512px;
            height: 512px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 28px;
            overflow: hidden;
          }
          p {
            font-family: sans-serif;
            font-weight: 300;
            color: #000000;
            word-break: break-word;
            line-height: 1.4;
            font-size: clamp(20px, ${Math.max(30, 120 - teks.length * 1.2)}px, 120px);
          }
        </style>
      </head>
      <body>
        <p>${teks.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </body>
      </html>
    `;

      await page.setContent(html, { waitUntil: "networkidle0" });
      const png = await page.screenshot({ type: "png" });
      await browser.close();

      const webp = await sharp(png)
        .resize(150, 150)
        .resize(512, 512, { kernel: "nearest" })
        .blur(5.0)
        .webp({ quality: 40 })
        .toBuffer();

      await sock.sendMessage(from, { sticker: webp });
    } catch (e) {
      console.error("[SQUOTE] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal buat stiker: ${e.message}`,
      });
    }
  },

  bratG: async (sock, from, args, pengirimJid, mentionedJids, msg) => {
    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const teks =
      args.join(" ").trim() ||
      quotedMsg?.conversation ||
      quotedMsg?.extendedTextMessage?.text ||
      "";

    if (!teks) {
      await sock.sendMessage(from, {
        text: `🎨 *!bratG [teks]*\n\n• Ketik *!bratG teks kamu*\n• Atau reply pesan lalu ketik *!bratG*`,
      });
      return;
    }

    await sock.sendMessage(from, { text: "⏳ Membuat stiker animasi..." });

    try {
      const puppeteer = (await import("puppeteer-core")).default;
      const sharp = (await import("sharp")).default;
      const GifEncoder = (await import("gif-encoder-2")).default;
      const { createCanvas, loadImage } = await import("canvas");

      const executablePath =
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

      const browser = await puppeteer.launch({
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "new",
      });

      const kata = teks.split(" ");
      const frames = [];

      for (let i = 1; i <= kata.length; i++) {
        const tampil = kata.slice(0, i).join(" ");
        const page = await browser.newPage();
        await page.setViewport({ width: 512, height: 512 });

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: 512px;
              height: 512px;
              background: white;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              padding: 28px;
              overflow: hidden;
            }
            p {
              font-family: sans-serif;
              font-weight: 300;
              color: #000000;
              word-break: break-word;
              line-height: 1.4;
              font-size: clamp(20px, ${Math.max(30, 120 - teks.length * 1.2)}px, 120px);
            }
          </style>
        </head>
        <body>
          <p>${tampil.replace(/</g, "&lt;").replace(/>/g, "&gt;")}&nbsp;</p>
        </body>
        </html>
      `;

        await page.setContent(html, { waitUntil: "networkidle0" });
        const png = await page.screenshot({ type: "png" });
        await page.close();

        // Clean — tanpa burik
        const clean = await sharp(png)
          .resize(512, 512)
          .blur(5.0)
          .png()
          .toBuffer();

        frames.push(clean);
      }

      // Tahan frame terakhir lebih lama
      for (let i = 0; i < 5; i++) frames.push(frames[frames.length - 1]);

      await browser.close();

      // ── Encode GIF ──
      const SIZE = 512;
      const gif = new GifEncoder(SIZE, SIZE);
      gif.setDelay(500);
      gif.setRepeat(0);
      gif.setQuality(5);
      gif.start();

      for (const framePng of frames) {
        const img = await loadImage(framePng);
        const canvas = createCanvas(SIZE, SIZE);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
        gif.addFrame(imageData.data);
      }

      gif.finish();
      const gifBuffer = gif.out.getData();

      // ── Convert ke animated webp ──
      const inPath = join(TEMP_DIR, `bratG_in_${Date.now()}.gif`);
      const outPath = join(TEMP_DIR, `bratG_out_${Date.now()}.webp`);

      writeFileSync(inPath, gifBuffer);

      await execFileAsync(FFMPEG, [
        "-i",
        inPath,
        "-vcodec",
        "libwebp",
        "-lossless",
        "0",
        "-q:v",
        "70",
        "-loop",
        "0",
        "-preset",
        "default",
        "-an",
        "-vsync",
        "0",
        outPath,
      ]);

      const webpBuffer = readFileSync(outPath);
      await sock.sendMessage(from, { sticker: webpBuffer });
    } catch (e) {
      console.error("[BRATG] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal buat stiker: ${e.message}`,
      });
    } finally {
      try {
        unlinkSync(join(TEMP_DIR, `bratG_in_*.gif`));
      } catch {}
      try {
        unlinkSync(join(TEMP_DIR, `bratG_out_*.webp`));
      } catch {}
    }
  },
};
