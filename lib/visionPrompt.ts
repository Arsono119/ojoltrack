export const VISION_PROMPT = `Ekstrak informasi berikut dari gambar struk/screenshot orderan ojol ini, dan kembalikan HANYA dalam format JSON:
{
  "nominal": <angka, tanpa titik/koma>,
  "jarak_km": <angka desimal jarak tempuh dalam KM jika tertera, jika tidak ada isi null>,
  "platform": "<Shopee Drive/Grab/lainnya, deteksi dari logo/warna/teks di screenshot>",
  "waktu": "<HH:mm jika ada>",
  "jenis": "<pendapatan/pengeluaran>",
  "keterangan": "<ringkasan singkat, contoh: 'Orderan GrabBike' atau 'Isi bensin'>"
}
Jika ada informasi yang tidak terlihat jelas, isi dengan null. Jangan tambahkan penjelasan lain, hanya JSON.`;
