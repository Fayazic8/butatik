document.addEventListener('DOMContentLoaded', () => {
    // === Ambil elemen dari DOM ===
    const namaKepsekInput = document.getElementById('namaKepsek');
    const nipKepsekInput = document.getElementById('nipKepsek');
    const namaSekolahInput = document.getElementById('namaSekolah');
    const logoUploadInput = document.getElementById('logoUpload');
    const signaturePad = document.getElementById('signaturePad');
    const clearSignatureBtn = document.getElementById('clearSignatureBtn');
    const previewCanvas = document.getElementById('previewCanvas');
    const downloadBtn = document.getElementById('downloadBtn');

    // === Setup Canvas untuk Tanda Tangan ===
    const sigCtx = signaturePad.getContext('2d');
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    // === Setup Canvas untuk Preview ===
    const prevCtx = previewCanvas.getContext('2d');
    let logoImage = null;

    // === Fungsi untuk menggambar di Signature Pad ===
    function startDrawing(e) {
        drawing = true;
        [lastX, lastY] = getMousePos(signaturePad, e);
    }

    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const [currentX, currentY] = getMousePos(signaturePad, e);
        sigCtx.beginPath();
        sigCtx.moveTo(lastX, lastY);
        sigCtx.lineTo(currentX, currentY);
        sigCtx.strokeStyle = '#000000';
        sigCtx.lineWidth = 2;
        sigCtx.lineCap = 'round';
        sigCtx.stroke();
        [lastX, lastY] = [currentX, currentY];
    }

    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        updatePreview(); // Update preview setelah selesai menggambar
    }

    // Helper untuk mendapatkan posisi mouse/touch
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const touch = evt.touches ? evt.touches[0] : null;
        return [
            (touch ? touch.clientX : evt.clientX) - rect.left,
            (touch ? touch.clientY : evt.clientY) - rect.top
        ];
    }

    // Event listeners untuk Signature Pad
    signaturePad.addEventListener('mousedown', startDrawing);
    signaturePad.addEventListener('mousemove', draw);
    signaturePad.addEventListener('mouseup', stopDrawing);
    signaturePad.addEventListener('mouseleave', stopDrawing);
    // Untuk Mobile
    signaturePad.addEventListener('touchstart', startDrawing);
    signaturePad.addEventListener('touchmove', draw);
    signaturePad.addEventListener('touchend', stopDrawing);


    // === Fungsi untuk Membersihkan Tanda Tangan ===
    clearSignatureBtn.addEventListener('click', () => {
        sigCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);
        updatePreview();
    });

    // === Event Listener untuk Inputan agar Live Update ===
    [namaKepsekInput, nipKepsekInput, namaSekolahInput].forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // === Handle Upload Logo ===
    logoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                logoImage = new Image();
                logoImage.onload = () => updatePreview();
                logoImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // === Fungsi Utama: Update Preview Canvas ===
    function updatePreview() {
        // Bersihkan canvas preview
        prevCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Background transparan
        prevCtx.fillStyle = 'rgba(255, 255, 255, 0)';
        prevCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        // --- Mulai menggambar elemen TTE ---
        conststartX = 20;
        let currentY = 40;

        // 1. Gambar Logo (jika ada)
        if (logoImage) {
            prevCtx.drawImage(logoImage, startX, currentY - 20, 50, 50); // Ukuran logo 50x50
        }
        
        // 2. Gambar QR Code
        const qrText = `Dokumen ini ditandatangani secara elektronik oleh:\nNama: ${namaKepsekInput.value}\nNIP: ${nipKepsekInput.value}\nSekolah: ${namaSekolahInput.value}`;
        const qr = qrcode(0, 'M');
        qr.addData(qrText);
        qr.make();
        const qrCodeImage = new Image();
        qrCodeImage.src = qr.createDataURL(4, 0);
        qrCodeImage.onload = () => {
             // Letakkan QR code di paling kiri
            prevCtx.drawImage(qrCodeImage, startX, currentY + 30, 80, 80);
        };
       

        // 3. Teks Keterangan
        const textX = startX + 110; // Posisi X untuk teks, beri ruang dari QR
        
        prevCtx.fillStyle = '#000';
        prevCtx.font = '14px Arial';
        prevCtx.fillText('Ditandatangani secara elektronik oleh:', textX, currentY);
        
        // 4. Gambar Tanda Tangan dari Signature Pad
        // Skala tanda tangan agar pas di area preview
        prevCtx.drawImage(signaturePad, textX, currentY + 10, 150, 75);

        // 5. Garis Bawah Tanda Tangan
        prevCtx.beginPath();
        prevCtx.moveTo(textX, currentY + 95);
        prevCtx.lineTo(textX + 200, currentY + 95);
        prevCtx.strokeStyle = '#000';
        prevCtx.lineWidth = 1;
        prevCtx.stroke();

        // 6. Teks Nama dan NIP
        currentY += 105;
        prevCtx.font = 'bold 16px Arial';
        prevCtx.fillText(namaKepsekInput.value || "Nama Kepala Sekolah", textX, currentY);
        
        currentY += 20;
        prevCtx.font = '14px Arial';
        prevCtx.fillText(`NIP. ${nipKepsekInput.value}` || "NIP. 123456789", textX, currentY);
    }

    // === Fungsi untuk Mengunduh Hasil ===
    downloadBtn.addEventListener('click', () => {
        // Panggil updatePreview sekali lagi untuk memastikan semua tergambar
        updatePreview();

        // Tunggu sebentar agar gambar (terutama QR code) selesai di-render
        setTimeout(() => {
            const link = document.createElement('a');
            const namaFile = `TTE_${(namaKepsekInput.value || 'Kepsek').replace(/\s/g, '_')}.png`;
            link.download = namaFile;
            link.href = previewCanvas.toDataURL('image/png');
            link.click();
        }, 500); // delay 0.5 detik
    });

    // Panggil pertama kali untuk tampilan awal
    updatePreview();
});
