# 📝 Ngasal App (Ngerjain Soal)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

Ngasal (Ngerjain Soal) App adalah platform kuis interaktif berbasis web yang memungkinkan pengguna untuk mengunggah kumpulan soal pilihan ganda buatan sendiri (berformat JSON) dan merubahnya menjadi simulasi ujian *Computer Based Test* (CBT) secara instan.

🌐 **Live Demo:** [ngasal.vercel.app](https://ngasal.vercel.app) *(Ganti dengan link Vercel aslimu)*

## ✨ Fitur Unggulan

- 📂 **Custom JSON Upload:** Tidak perlu *database*, cukup *drag & drop* file JSON, kuis langsung siap dikerjakan.
- 💾 **Auto-Save Progress:** Jawaban dan posisi soal otomatis tersimpan di *browser*. Aman meski halaman tidak sengaja di-*refresh*!
- 🌗 **Dark / Light Mode:** Dilengkapi *toggle* mode gelap untuk kenyamanan mata saat mengerjakan soal dalam waktu lama.
- 🔀 **Mode Urut & Acak:** Opsi pengacakan urutan soal dengan algoritma *Fisher-Yates* sebelum ujian dimulai.
- 📱 **Mobile Optimized:** Antarmuka responsif dengan tombol pilihan ganda dan navigasi *grid* yang ramah di layar sentuh.
- 🚀 **Kumpulkan Langsung:** Tombol pintas untuk menyelesaikan kuis kapan saja tanpa harus melompat ke nomor terakhir.
- 📊 **Kalkulasi Skor Instan:** Langsung menampilkan hasil akhir setelah soal dikumpulkan dengan opsi "Kerjakan Ulang".

## 📖 Panduan Format Soal (JSON)

Agar aplikasi dapat membaca soal dengan benar, pastikan file JSON yang diunggah memiliki struktur struktur *array of objects* seperti contoh berikut:

```json
[
  {
    "id": 1,
    "question": "Apa nama ibu kota Indonesia saat ini?",
    "options": ["Jakarta", "Bandung", "Surabaya", "Semarang"],
    "correctAnswer": "Jakarta"
  },
  {
    "id": 2,
    "question": "Berapa hasil perkalian 12 x 12?",
    "options": ["124", "134", "144", "154"],
    "correctAnswer": "144"
  }
]