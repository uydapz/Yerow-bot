# 🤖 WhatsApp Grup Bot — Baileys

Bot WhatsApp grup pure JavaScript menggunakan Baileys.

---

## 📦 Fitur

- ✅ Prefix command (`!perintah`)
- ✅ Keyword otomatis (halo, hai, selamat pagi, dll)
- ✅ Respons saat di-mention
- ✅ Sambut member baru & pesan perpisahan
- ✅ Anti link (warning + auto kick di warn ke-3)
- ✅ Anti tag/forward story (warning + auto kick di warn ke-3)
- ✅ Sistem absen harian
- ✅ List member grup
- ✅ Jadwal pesan otomatis (harian & mingguan)
- ✅ Rekap absen otomatis jam 21.00 WIB
- ✅ Kick member (admin)
- ✅ Reset peringatan member

---

## 🚀 Cara Install

### 1. Pastikan Node.js sudah terinstall
```
node --version   # minimal v18
```

### 2. Install dependencies
```
npm install
```

### 3. Jalankan bot
```
npm start
```

### 4. Scan QR Code
- Buka WhatsApp di HP
- Ke Perangkat Tertaut → Tautkan Perangkat
- Scan QR yang muncul di terminal

### 5. Dapatkan ID Grup
- Masuk ke grup target
- Kirim pesan: `!grupid`
- Salin ID yang muncul (format: `628xxx-xxx@g.us`)

### 6. Set ID Grup di config.js
```js
grupId: '628xxx-xxx@g.us',
```

### 7. Jadikan bot sebagai Admin Grup
Agar fitur kick dan anti-link berfungsi, bot harus dijadikan admin grup oleh admin.

---

## 📋 Daftar Perintah

| Perintah | Fungsi |
|----------|--------|
| `!bantuan` | Tampilkan menu perintah |
| `!ping` | Cek bot aktif |
| `!info` | Info grup |
| `!absen` | Absen kehadiran hari ini |
| `!lihatAbsen` | Lihat absen hari ini |
| `!lihatAbsen 19/3/2026` | Lihat absen tanggal tertentu |
| `!listMember` | Daftar semua member grup |
| `!kick @member` | Kick member (admin) |
| `!resetWarn @member` | Reset peringatan member |
| `!grupid` | Tampilkan ID grup |

---

## ⚙️ Kustomisasi

Edit file `config.js` untuk:
- Ganti prefix (default: `!`)
- Tambah/edit keyword otomatis
- Tambah/edit jadwal harian & mingguan
- Whitelist link yang diperbolehkan

---

## 📁 Struktur File

```
whatsapp-bot/
├── index.js        ← File utama bot
├── config.js       ← Pengaturan bot
├── data.js         ← Penyimpanan data (absen, warn, member)
├── package.json    ← Dependencies
├── auth_info/      ← Dibuat otomatis saat pertama login
└── README.md       ← Panduan ini
```

---

## ⚠️ Catatan Penting

- Gunakan nomor WhatsApp **khusus bot**, bukan nomor pribadi
- Bot harus dijadikan **admin grup** untuk bisa kick member
- Data absen & warn hilang saat bot di-restart (in-memory)
  - Untuk data permanen, gunakan file JSON atau database SQLite
- Penggunaan library tidak resmi berisiko kena ban dari WhatsApp
