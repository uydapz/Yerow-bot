// commands/tools.js — Tools: Download, TTS, Translate, dll

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
      a: ["apel", "ayam", "angin", "awan", "akar"],
      b: ["bunga", "buku", "burung", "batu", "bulan"],
      c: ["cinta", "cahaya", "cermin", "cuaca", "ceria"],
      d: ["daun", "danau", "doa", "dewa", "diam"],
      e: ["elang", "embun", "emas", "entah", "era"],
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
      await sock.sendMessage(from, {
        text:
          `🌤️ *Cuaca ${area.areaName[0].value}, ${area.country[0].value}*\n\n` +
          `🌡️ Suhu: *${cc.temp_C}°C* (terasa ${cc.FeelsLikeC}°C)\n` +
          `☁️ Kondisi: *${cc.weatherDesc[0].value}*\n` +
          `💧 Kelembaban: *${cc.humidity}%*\n` +
          `💨 Angin: *${cc.windspeedKmph} km/h*`,
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
};
