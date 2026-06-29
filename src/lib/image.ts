/**
 * Mengompres berkas gambar di sisi klien menggunakan HTML5 Canvas.
 * Mengubah resolusi gambar jika melebihi batas maksimum dan mengompresinya dengan rasio kualitas tertentu.
 */
export async function compressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Pastikan berkas adalah gambar
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung dimensi baru untuk mempertahankan rasio aspek
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback ke berkas asli jika canvas gagal
        }

        // Gambar ulang berkas gambar ke canvas dengan dimensi baru
        ctx.drawImage(img, 0, 0, width, height);

        // Kompresi ke format JPEG (didukung universal oleh semua peramban)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // Fallback ke berkas asli jika toBlob gagal
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
