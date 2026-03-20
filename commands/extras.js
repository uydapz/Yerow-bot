// commands/extras.js — 14 fitur tambahan (genap 100 cmd)

export default {
  // ── !wiki [topik] ──
  wiki: async (sock, from, args) => {
    const topik = args.join(" ").trim();
    if (!topik) {
      await sock.sendMessage(from, {
        text: "❌ Format: !wiki [topik]\nContoh: !wiki Borobudur",
      });
      return;
    }
    try {
      const fetch = (await import("node-fetch")).default;
      const res = await fetch(
        `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topik)}`,
      );
      if (!res.ok) throw new Error("Tidak ditemukan");
      const data = await res.json();
      const ringkasan = data.extract?.slice(0, 500) || "Tidak ada ringkasan.";
      await sock.sendMessage(from, {
        text:
          `📚 *Wikipedia: ${data.title}*\n\n` +
          `${ringkasan}${data.extract?.length > 500 ? "..." : ""}\n\n` +
          `🔗 ${data.content_urls?.mobile?.page || ""}`,
      });
    } catch {
      await sock.sendMessage(from, {
        text: `❌ Topik *"${topik}"* tidak ditemukan di Wikipedia.`,
      });
    }
  },

  // ── !pantun ──
  pantun: async (sock, from) => {
    const pantuns = [
      "Pergi ke pasar membeli mentimun\nDibungkus dengan daun pisang\nKalau kamu sudah bingung\nBaca pantun biar senang",
      "Buah mangga buah kedondong\nDimakan bersama nasi putih\nJangan suka bergondong-gondong\nNanti hati jadi perih",
      "Ada udang di balik batu\nAda ikan di dalam kolam\nJika hati terasa batu\nIngat kenangan yang dalam",
      "Pagi hari minum kopi\nKopi panas di cangkir biru\nHati siapa tak akan sepi\nKalau ingat selalu dirimu",
      "Jalan-jalan ke kota Madiun\nJangan lupa beli batik\nKalau kamu rajin belajar tiap tahun\nPasti hidupmu makin cantik",
      "Hujan rintik turun perlahan\nBasahi tanah dan rerumputan\nSemangat hati jangan pudarkan\nRaih mimpi dengan penuh harapan",
      "Bunga melati warna putih\nDitanam di pinggir jalan\nJika hati sudah perih\nSenyum dulu, semua akan baikan",
      "Pohon kelapa di tepi pantai\nBuahnya jatuh satu per satu\nSemoga hidupmu selalu damai\nDan bahagia setiap waktu",
    ];
    const p = pantuns[Math.floor(Math.random() * pantuns.length)];
    await sock.sendMessage(from, { text: `🎭 *Pantun*\n\n_${p}_` });
  },

  // ── !horoscope [zodiak] ──
  horoscope: async (sock, from, args) => {
    const zodiak = args[0]?.toLowerCase().trim();
    const zodiakList = [
      "aries",
      "taurus",
      "gemini",
      "cancer",
      "leo",
      "virgo",
      "libra",
      "scorpio",
      "sagittarius",
      "capricorn",
      "aquarius",
      "pisces",
    ];

    if (!zodiak || !zodiakList.includes(zodiak)) {
      await sock.sendMessage(from, {
        text:
          `♈ *Horoscope*\n\nFormat: *!horoscope [zodiak]*\n\n` +
          `Pilihan: ${zodiakList.join(", ")}`,
      });
      return;
    }

    const ramalanList = [
      "Hari ini energimu sangat tinggi! Manfaatkan untuk hal produktif.",
      "Jaga kesehatan dan istirahat yang cukup hari ini.",
      "Rezeki datang dari arah yang tidak terduga. Tetap bersyukur!",
      "Komunikasi adalah kunci hari ini. Bicara dari hati.",
      "Fokus pada tujuanmu. Jangan mudah terdistraksi.",
      "Hubungan sosialmu membaik. Waktu yang baik untuk bersilaturahmi.",
      "Keuanganmu perlu perhatian lebih. Bijak dalam pengeluaran.",
      "Kreativitasmu sedang tinggi. Ekspresikan dirimu!",
    ];

    const emoji = {
      aries: "♈",
      taurus: "♉",
      gemini: "♊",
      cancer: "♋",
      leo: "♌",
      virgo: "♍",
      libra: "♎",
      scorpio: "♏",
      sagittarius: "♐",
      capricorn: "♑",
      aquarius: "♒",
      pisces: "♓",
    };

    const aspek = ["Cinta", "Karir", "Kesehatan", "Keuangan"];
    const bintang = () => "⭐".repeat(Math.floor(Math.random() * 3) + 3);
    const ramalan = () =>
      ramalanList[Math.floor(Math.random() * ramalanList.length)];
    const hari = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    await sock.sendMessage(from, {
      text:
        `${emoji[zodiak]} *Horoscope ${zodiak.charAt(0).toUpperCase() + zodiak.slice(1)}*\n` +
        `📅 ${hari}\n\n` +
        `💫 *Ramalan Hari Ini:*\n${ramalan()}\n\n` +
        `❤️ Cinta: ${bintang()}\n` +
        `💼 Karir: ${bintang()}\n` +
        `💪 Kesehatan: ${bintang()}\n` +
        `💰 Keuangan: ${bintang()}\n\n` +
        `🍀 *Lucky Number:* ${Math.floor(Math.random() * 99) + 1}\n` +
        `🎨 *Lucky Color:* ${["Merah", "Biru", "Hijau", "Kuning", "Ungu", "Orange"][Math.floor(Math.random() * 6)]}`,
    });
  },

  // ── !suhu [nilai] [satuan] ──
  suhu: async (sock, from, args) => {
    const nilai = parseFloat(args[0]);
    const satuan = args[1]?.toUpperCase();
    if (isNaN(nilai) || !["C", "F", "K"].includes(satuan)) {
      await sock.sendMessage(from, {
        text: "❌ Format: !suhu [angka] [C/F/K]\nContoh: !suhu 100 C",
      });
      return;
    }
    let C, F, K;
    if (satuan === "C") {
      C = nilai;
      F = (C * 9) / 5 + 32;
      K = C + 273.15;
    } else if (satuan === "F") {
      F = nilai;
      C = ((F - 32) * 5) / 9;
      K = C + 273.15;
    } else {
      K = nilai;
      C = K - 273.15;
      F = (C * 9) / 5 + 32;
    }

    await sock.sendMessage(from, {
      text:
        `🌡️ *Konversi Suhu*\n\n` +
        `Input: *${nilai}°${satuan}*\n\n` +
        `🔵 Celsius: *${C.toFixed(2)}°C*\n` +
        `🔴 Fahrenheit: *${F.toFixed(2)}°F*\n` +
        `🟡 Kelvin: *${K.toFixed(2)}K*`,
    });
  },

  // ── !timer [menit] [pesan] ──
  timer: async (sock, from, args) => {
    const menit = parseInt(args[0]);
    const pesan = args.slice(1).join(" ") || "Waktu habis!";
    if (isNaN(menit) || menit < 1 || menit > 60) {
      await sock.sendMessage(from, {
        text: "❌ Format: !timer [1-60 menit] [pesan]\nContoh: !timer 5 Waktunya ngumpul!",
      });
      return;
    }
    await sock.sendMessage(from, {
      text: `⏱️ *Timer diset ${menit} menit!*\n📝 "${pesan}"\n\n_Bot akan mengingatkan saat waktu habis._`,
    });
    setTimeout(
      async () => {
        await sock.sendMessage(from, {
          text: `⏰ *TIMER SELESAI!*\n\n⏱️ ${menit} menit telah berlalu.\n📢 ${pesan}`,
        });
      },
      menit * 60 * 1000,
    );
  },

  // ── !trivia ──
  trivia: async (sock, from) => {
    const trivias = [
      {
        q: "Ibu kota Australia adalah?",
        a: "Canberra",
        opts: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
      },
      {
        q: "Planet terbesar di tata surya adalah?",
        a: "Jupiter",
        opts: ["Saturnus", "Jupiter", "Uranus", "Neptunus"],
      },
      {
        q: "Siapa penemu bola lampu?",
        a: "Thomas Edison",
        opts: [
          "Nikola Tesla",
          "Albert Einstein",
          "Thomas Edison",
          "Isaac Newton",
        ],
      },
      {
        q: "Berapa jumlah sisi pada segitiga?",
        a: "3",
        opts: ["2", "3", "4", "5"],
      },
      {
        q: "Bahasa pemrograman yang digunakan di bot ini?",
        a: "JavaScript",
        opts: ["Python", "Java", "JavaScript", "C++"],
      },
      {
        q: "Negara dengan penduduk terbanyak di dunia?",
        a: "India",
        opts: ["China", "India", "Amerika", "Indonesia"],
      },
      {
        q: "Benua terkecil di dunia adalah?",
        a: "Australia",
        opts: ["Eropa", "Australia", "Antartika", "Amerika Selatan"],
      },
      {
        q: "Unsur kimia dengan simbol Au adalah?",
        a: "Emas",
        opts: ["Perak", "Emas", "Tembaga", "Besi"],
      },
    ];

    const t = trivias[Math.floor(Math.random() * trivias.length)];
    const shuffled = t.opts.sort(() => Math.random() - 0.5);
    const huruf = ["A", "B", "C", "D"];
    const opsiTeks = shuffled.map((o, i) => `${huruf[i]}. ${o}`).join("\n");
    const jawabanHuruf = huruf[shuffled.indexOf(t.a)];

    await sock.sendMessage(from, {
      text:
        `🧠 *TRIVIA*\n\n` +
        `❓ ${t.q}\n\n` +
        `${opsiTeks}\n\n` +
        `_Jawab dalam 30 detik!_`,
    });

    setTimeout(async () => {
      await sock.sendMessage(from, {
        text: `✅ *Jawaban:* ${jawabanHuruf}. ${t.a}`,
      });
    }, 30000);
  },

  // ── !resep [makanan] ──
  resep: async (sock, from, args) => {
    const makanan = args.join(" ").toLowerCase().trim();
    if (!makanan) {
      await sock.sendMessage(from, {
        text: "❌ Format: !resep [makanan]\nContoh: !resep nasi goreng",
      });
      return;
    }
    const resepDb = {
      "nasi goreng": {
        bahan:
          "2 piring nasi, 2 butir telur, 3 siung bawang putih, 2 sdm kecap manis, garam, merica",
        cara: "1. Tumis bawang putih hingga harum\n2. Masukkan telur, orak-arik\n3. Masukkan nasi, aduk rata\n4. Tambahkan kecap, garam, merica\n5. Sajikan panas",
      },
      "mie goreng": {
        bahan:
          "1 bungkus mie, 2 butir telur, kecap manis, bawang merah, bawang putih, cabai",
        cara: "1. Rebus mie hingga matang, tiriskan\n2. Tumis bumbu hingga harum\n3. Masukkan telur, orak-arik\n4. Masukkan mie, tambahkan kecap\n5. Sajikan dengan taburan bawang goreng",
      },
      "ayam goreng": {
        bahan:
          "1 ekor ayam, kunyit, ketumbar, bawang putih, jahe, garam, minyak goreng",
        cara: "1. Haluskan bumbu\n2. Lumuri ayam dengan bumbu, diamkan 30 menit\n3. Rebus ayam dengan bumbu hingga matang\n4. Goreng hingga kecokelatan\n5. Sajikan dengan sambal dan lalapan",
      },
    };

    const resep = resepDb[makanan];
    if (!resep) {
      await sock.sendMessage(from, {
        text: `❌ Resep *${makanan}* belum tersedia.\nResep yang ada: ${Object.keys(resepDb).join(", ")}`,
      });
      return;
    }

    await sock.sendMessage(from, {
      text:
        `🍳 *Resep ${makanan.charAt(0).toUpperCase() + makanan.slice(1)}*\n\n` +
        `🛒 *Bahan:*\n${resep.bahan}\n\n` +
        `👨‍🍳 *Cara Memasak:*\n${resep.cara}`,
    });
  },

  // ── !tebakkata ──
  tebakkata: async (sock, from, args, pengirimJid) => {
    const kataList = [
      { kata: "kucing", hint: "hewan peliharaan yang suka tidur" },
      { kata: "komputer", hint: "alat elektronik untuk bekerja" },
      { kata: "pelangi", hint: "muncul setelah hujan, berwarna-warni" },
      { kata: "indonesia", hint: "negara kepulauan terbesar di dunia" },
      { kata: "bunga", hint: "bagian tumbuhan yang harum dan indah" },
      { kata: "samudra", hint: "lautan yang sangat luas dan dalam" },
    ];

    const pilihan = kataList[Math.floor(Math.random() * kataList.length)];
    const tersembunyi = pilihan.kata
      .split("")
      .map((h, i) => (i === 0 || i === pilihan.kata.length - 1 ? h : "_"))
      .join(" ");

    await sock.sendMessage(from, {
      text:
        `🔤 *TEBAK KATA*\n\n` +
        `💡 Petunjuk: _${pilihan.hint}_\n` +
        `📝 Kata: \`${tersembunyi}\`\n` +
        `🔢 Jumlah huruf: ${pilihan.kata.length}\n\n` +
        `_Ketik jawabanmu! Jawaban akan terungkap dalam 60 detik._`,
    });

    setTimeout(async () => {
      await sock.sendMessage(from, {
        text: `⏰ Waktu habis! Jawabannya adalah: *${pilihan.kata}*`,
      });
    }, 60000);
  },

  // ── !namabayi [L/P] ──
  namabayi: async (sock, from, args) => {
    const gender = args[0]?.toUpperCase();
    if (!["L", "P"].includes(gender)) {
      await sock.sendMessage(from, {
        text: "❌ Format: !namabayi [L/P]\nL = Laki-laki, P = Perempuan",
      });
      return;
    }

    const namaL = [
      { nama: "Arjuna", arti: "bersih, cemerlang" },
      { nama: "Farhan", arti: "gembira, bahagia" },
      { nama: "Zaidan", arti: "pertumbuhan, kemajuan" },
      { nama: "Rafif", arti: "lembut, halus" },
      { nama: "Azzam", arti: "tekad, kemauan kuat" },
      { nama: "Naufal", arti: "dermawan, murah hati" },
    ];

    const namaP = [
      { nama: "Aisyah", arti: "hidup, bersemangat" },
      { nama: "Zahra", arti: "bunga, bersinar" },
      { nama: "Nayla", arti: "yang mendapat kenikmatan" },
      { nama: "Khalisa", arti: "murni, bersih" },
      { nama: "Rania", arti: "ratu yang cantik" },
      { nama: "Safira", arti: "batu permata biru" },
    ];

    const list = gender === "L" ? namaL : namaP;
    const pilihan = list.sort(() => Math.random() - 0.5).slice(0, 3);
    const emoji = gender === "L" ? "👦" : "👧";

    const teks = pilihan
      .map((n, i) => `${i + 1}. *${n.nama}* — _${n.arti}_`)
      .join("\n");

    await sock.sendMessage(from, {
      text: `${emoji} *Ide Nama Bayi ${gender === "L" ? "Laki-laki" : "Perempuan"}*\n\n${teks}`,
    });
  },

  // ── !cerita ──
  cerita: async (sock, from) => {
    const ceritaList = [
      `🌙 *Bintang Jatuh*\n\nAda seorang anak kecil yang setiap malam berdoa sambil melihat bintang. Suatu malam, sebuah bintang jatuh tepat di depannya. Ternyata bintang itu adalah seorang peri kecil yang tersesat. Sang anak pun menuntunnya pulang ke langit. Sejak saat itu, langit selalu bersinar lebih terang di atas rumahnya.`,
      `🌊 *Penangkap Ikan*\n\nSeorang nelayan tua selalu pulang dengan tangan kosong. Suatu hari, ia menemukan seekor ikan kecil yang berkilau. Ikan itu memintanya untuk dilepaskan dan berjanji akan membawa ikan-ikan lain. Sang nelayan melepaskannya. Keesokan harinya, jala penuh ikan hingga ia tak bisa mengangkatnya sendiri.`,
      `🌺 *Taman Ajaib*\n\nDi sudut kota yang sunyi, ada taman kecil yang selalu berbunga. Tidak ada yang tahu siapa yang merawatnya. Hingga suatu hari, seorang anak perempuan terjatuh di sana. Ia menemukan kupu-kupu kecil yang sedang menyiram bunga dengan embun pagi. Taman itu pun menjadi rahasia indah mereka berdua.`,
    ];
    const c = ceritaList[Math.floor(Math.random() * ceritaList.length)];
    await sock.sendMessage(from, { text: c });
  },

  // ── !jadwalsholat [kota] ──
  jadwalsholat: async (sock, from, args) => {
    const kota = args.join(" ").trim() || "Jakarta";
    try {
      const fetch = (await import("node-fetch")).default;
      const today = new Date();
      const dd = today.getDate();
      const mm = today.getMonth() + 1;
      const yyyy = today.getFullYear();

      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dd}-${mm}-${yyyy}?city=${encodeURIComponent(kota)}&country=Indonesia&method=11`,
      );
      if (!res.ok) throw new Error("Kota tidak ditemukan");
      const data = await res.json();
      const t = data.data.timings;

      await sock.sendMessage(from, {
        text:
          `🕌 *Jadwal Sholat ${kota}*\n` +
          `📅 ${today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n\n` +
          `🌅 Subuh: *${t.Fajr}*\n` +
          `☀️ Dhuha: *${t.Sunrise}*\n` +
          `🌤️ Dzuhur: *${t.Dhuhr}*\n` +
          `🌇 Ashar: *${t.Asr}*\n` +
          `🌆 Maghrib: *${t.Maghrib}*\n` +
          `🌙 Isya: *${t.Isha}*`,
      });
    } catch (e) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ambil jadwal sholat: ${e.message}`,
      });
    }
  },

  // ── !gpt [pertanyaan] ──
  gpt: async (sock, from, args) => {
    const pertanyaan = args.join(" ").trim();
    if (!pertanyaan) {
      await sock.sendMessage(from, {
        text: "❌ Format: !gpt [pertanyaan]\nContoh: !gpt apa itu photosynthesis?",
      });
      return;
    }
    // Jawaban sederhana tanpa API berbayar
    const jawaban = [
      `Pertanyaan yang menarik! "${pertanyaan}" adalah topik yang kompleks. Secara singkat, ini melibatkan banyak aspek yang saling berkaitan. Untuk jawaban lebih detail, disarankan mencari di Google atau Wikipedia.`,
      `Mengenai "${pertanyaan}", jawabannya bergantung pada konteks. Secara umum, hal ini dapat dijelaskan dari berbagai sudut pandang ilmu pengetahuan dan pengalaman.`,
    ];
    await sock.sendMessage(from, {
      text: `🤖 *GPT Bot*\n\n❓ ${pertanyaan}\n\n💬 ${jawaban[Math.floor(Math.random() * jawaban.length)]}\n\n_Untuk jawaban lebih akurat, gunakan ChatGPT langsung._`,
    });
  },

  // ── !hangman ──
  hangman: async (sock, from) => {
    const kataList = [
      "kucing",
      "rumah",
      "bunga",
      "pohon",
      "langit",
      "angin",
      "hujan",
      "matahari",
    ];
    const kata = kataList[Math.floor(Math.random() * kataList.length)];
    const tersembunyi = "_ ".repeat(kata.length).trim();

    await sock.sendMessage(from, {
      text:
        `🎮 *HANGMAN*\n\n` +
        `\`\`\`\n` +
        ` ___\n` +
        `|   |\n` +
        `|\n` +
        `|\n` +
        `|\n` +
        `|___\n` +
        `\`\`\`\n` +
        `📝 Kata: \`${tersembunyi}\`\n` +
        `🔢 ${kata.length} huruf\n\n` +
        `_Tebak hurufnya satu per satu!\n` +
        `Jawaban muncul dalam 90 detik._`,
    });

    setTimeout(async () => {
      await sock.sendMessage(from, {
        text: `⏰ Game selesai! Jawabannya: *${kata}*`,
      });
    }, 90000);
  },
};
