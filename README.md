# Mini Canva: Backend

REST API untuk menyimpan canvas (screen) beserta elemennya, serta mem-publish draft menjadi versi yang tidak berubah. Dipakai oleh frontend editor dan oleh aplikasi penampil (desktop) yang membaca versi yang sudah dipublish.

## Teknologi

- [Express](https://expressjs.com/) 5 + TypeScript
- [Prisma ORM](https://www.prisma.io/) 7 dengan driver adapter `pg`
- PostgreSQL (disarankan [Supabase](https://supabase.com/), bisa juga Postgres lokal)
- [Zod](https://zod.dev/) untuk validasi
- pnpm dan [tsx](https://tsx.is/) untuk menjalankan TypeScript

## Prasyarat

- Node.js 20 atau lebih baru
- pnpm (`npm i -g pnpm`)
- Database PostgreSQL (Supabase atau lokal)

## Setup

### 1. Install dependensi

```bash
git clone <url-repo>
cd backend
pnpm install
```

> **Versi Prisma**: gunakan **7.x**. Jangan upgrade ke 8.0 (masih release candidate dan perintah CLI-nya berbeda).
> Cek dengan `pnpm prisma --version`. Kalau bukan 7.x, jalankan:
> `pnpm add -D prisma@7` dan `pnpm add @prisma/client@7 @prisma/adapter-pg@7`.

### 2. Siapkan database

**Opsi A: Supabase (disarankan)**

1. Buat project di Supabase dan simpan _database password_-nya.
2. Klik tombol **Connect** di dashboard, lalu salin URI dari bagian **Session pooler** (port 5432). Bentuknya:

   ```
   postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

3. Ganti `[PASSWORD]` dengan password asli, **termasuk tanda kurung sikunya**. Kalau password berisi karakter khusus (`@`, `#`, `/`, `:`, `?`), ubah menjadi bentuk URL-encoded atau reset password menjadi huruf dan angka saja.

Pakai Session pooler, bukan Transaction pooler (port 6543). Transaction pooler tidak cocok untuk migrasi.

**Opsi B: PostgreSQL lokal dengan Docker**

```bash
docker run --name canva-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mini_canva -p 5432:5432 -d postgres:17
```

Connection string-nya: `postgresql://postgres:postgres@localhost:5432/mini_canva`

### 3. Buat file `.env`

Di root folder backend:

```
DATABASE_URL="postgresql://..."
CORS_ORIGIN="http://localhost:3000"
```

| Variabel       | Fungsi                                       |
| -------------- | -------------------------------------------- |
| `DATABASE_URL` | Connection string PostgreSQL                 |
| `CORS_ORIGIN`  | Alamat frontend yang diizinkan memanggil API |

Jangan commit file `.env` ke Git.

### 4. Migrasi dan generate client

```bash
pnpm db:migrate --name init
pnpm db:generate
```

`db:migrate` membuat tabel di database. `db:generate` membuat Prisma Client di `src/generated/prisma`. Di Prisma 7, `migrate` **tidak** otomatis menjalankan generate, jadi jalankan keduanya. Ulangi keduanya setiap kali `prisma/schema.prisma` diubah.

### 6. Jalankan server

```bash
pnpm dev
```

Server aktif di `http://localhost:4000`.

## Script

| Perintah           | Fungsi                                            |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Server development dengan auto-reload             |
| `pnpm db:migrate`  | Membuat dan menjalankan migrasi (`--name <nama>`) |
| `pnpm db:generate` | Membuat ulang Prisma Client                       |

## Endpoint

| Method | URL                      | Fungsi                                |
| ------ | ------------------------ | ------------------------------------- |
| `POST` | `/screens`               | Buat screen/canvas baru               |
| `GET`  | `/screens/:id`           | Ambil draft (screen dan elemennya)    |
| `PUT`  | `/screens/:id`           | Simpan draft (semua elemen sekaligus) |
| `POST` | `/screens/:id/publish`   | Publish draft menjadi versi baru      |
| `GET`  | `/screens/:id/published` | Ambil versi publish terbaru           |

### `POST /screens`

Body:

```json
{ "width": 1920, "height": 1080 }
```

Respons `201`:

```json
{
  "id": "uuid",
  "width": 1920,
  "height": 1080,
  "elements": [],
  "publishedVersion": 0,
  "updatedAt": "2026-10-04T10:00:00.000Z"
}
```

### `PUT /screens/:id`

Body: seluruh elemen draft, menggantikan isi sebelumnya.

```json
{
  "elements": [
    {
      "id": "a1",
      "type": "text",
      "x": 100,
      "y": 100,
      "width": 400,
      "height": 100,
      "zIndex": 1,
      "text": "Halo",
      "color": "#000000",
      "fontSize": 48
    },
    {
      "id": "b2",
      "type": "image",
      "x": 600,
      "y": 100,
      "width": 400,
      "height": 300,
      "zIndex": 2,
      "imageUrl": "https://example.com/gambar.png"
    },
    {
      "id": "c3",
      "type": "button",
      "x": 100,
      "y": 400,
      "width": 240,
      "height": 80,
      "zIndex": 3,
      "label": "Next",
      "actionId": "next-page",
      "backgroundColor": "#000000",
      "color": "#ffffff",
      "fontSize": 32
    }
  ]
}
```

Respons `200`: draft terbaru (bentuk sama seperti respons `POST /screens`).

### `POST /screens/:id/publish`

Tanpa body. Respons `201`:

```json
{ "screenId": "uuid", "version": 2, "publishedAt": "2026-10-04T10:05:00.000Z" }
```

### `GET /screens/:id/published`

Respons `200`:

```json
{
  "screenId": "uuid",
  "version": 2,
  "width": 1920,
  "height": 1080,
  "elements": [],
  "publishedAt": "2026-10-04T10:05:00.000Z"
}
```

Respons `404` kalau screen belum pernah dipublish.

### Kode error

| Kode  | Arti                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `400` | Validasi gagal (format salah, lebih dari 20 elemen, elemen keluar canvas, atau id elemen kembar). Pesannya ada di `error` atau `errors`. |
| `404` | Screen tidak ditemukan, atau belum ada versi yang dipublish                                                                              |
| `500` | Kesalahan server                                                                                                                         |

## Aturan

- Satu screen maksimal **20 elemen**.
- Elemen harus berada **di dalam canvas**: `x >= 0`, `y >= 0`, `x + width <= lebar canvas`, `y + height <= tinggi canvas`.
- Id elemen harus unik di dalam satu screen.
- **Publish membuat salinan.** Mengedit dan menyimpan draft setelah publish tidak mengubah versi yang sudah dipublish sampai publish dilakukan lagi.
- **Setiap publish menaikkan nomor versi** (1, 2, 3, ...) per screen.

## Skema database

- **`Screen`**: satu baris per canvas. Menyimpan ukuran, draft (`elements` sebagai JSON), dan `publishedVersion` (versi publish terakhir, awalnya 0).
- **`PublishedScreen`**: satu baris per hasil publish, berisi salinan ukuran dan elemen. Kombinasi `screenId` + `version` bersifat unik. Baris di sini tidak pernah diubah setelah dibuat, dan ikut terhapus kalau `Screen` induknya dihapus.

Publish dijalankan dalam satu transaksi (naikkan versi, lalu salin draft), jadi dua publish bersamaan tidak akan mendapat nomor versi yang sama.

## Mencoba dengan curl

Contoh di bawah untuk Git Bash atau terminal Linux/macOS. Di PowerShell Windows, gunakan `curl.exe` dengan JSON yang di-escape, atau lebih mudah pakai Thunder Client atau Postman.

```bash
# 1. buat screen, catat "id" dari respons
curl -X POST localhost:4000/screens -H "Content-Type: application/json" \
  -d '{"width":1920,"height":1080}'

# 2. simpan draft (ganti ID)
curl -X PUT localhost:4000/screens/ID -H "Content-Type: application/json" \
  -d '{"elements":[{"id":"a","type":"text","x":100,"y":100,"width":400,"height":100,"zIndex":1,"text":"Halo","color":"#000000","fontSize":48}]}'

# 3. publish (versi 1)
curl -X POST localhost:4000/screens/ID/publish

# 4. lihat versi publish
curl localhost:4000/screens/ID/published
```

Uji aturan: kirim elemen dengan `x: 1800` dan `width: 400` (keluar canvas), atau 21 elemen sekaligus. Keduanya harus menghasilkan `400`.

## Troubleshooting

| Masalah                                                            | Penyebab dan solusi                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P1001: Can't reach database server`                               | Port 5432 tidak terjangkau dari jaringanmu. Di PowerShell: `Test-NetConnection <host-pooler> -Port 5432`. Kalau `False`, coba jaringan lain atau VPN. Pastikan juga project Supabase aktif dan host di `.env` sama persis dengan di dashboard. |
| Koneksi gagal padahal host benar                                   | Cek `DATABASE_URL`: `[YOUR-PASSWORD]` harus diganti lengkap dengan kurung sikunya, dan karakter khusus di password harus di-encode.                                                                                                            |
| `Cannot find module '../generated/prisma/client'`                  | Client belum dibuat. Jalankan `pnpm db:generate`, lalu restart TS Server di editor.                                                                                                                                                            |
| `Cannot find name 'process'`                                       | Tambahkan `"types": ["node"]` di `compilerOptions` pada `tsconfig.json`, dan pastikan `@types/node` terpasang.                                                                                                                                 |
| `Cannot find name 'env'` di `prisma.config.ts`                     | Tambahkan `env` pada import: `import { defineConfig, env } from "prisma/config"`.                                                                                                                                                              |
| Perintah Prisma tidak dikenali (`generate`, `migrate`, `validate`) | CLI Prisma yang terpasang bukan 7.x. Pin ke versi 7 (lihat catatan di bagian Setup).                                                                                                                                                           |
| Error CORS dari frontend                                           | Samakan `CORS_ORIGIN` di `.env` dengan alamat frontend, lalu restart backend.                                                                                                                                                                  |
| `PayloadTooLargeError`                                             | Body request melebihi batas (20 MB). Biasanya karena gambar base64 yang terlalu besar.                                                                                                                                                         |
