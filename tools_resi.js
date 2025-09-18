// Fungsi untuk cek resi
document.getElementById('checkResiBtn').addEventListener('click', async () => {
    const resiNumber = document.getElementById('resiNumber').value.trim();
    const courier = document.getElementById('courierSelect').value;
    
    if (!resiNumber) {
        showResiError('Mohon masukkan nomor resi');
        return;
    }
    
    if (!courier) {
        showResiError('Mohon pilih kurir');
        return;
    }
    
    // Tampilkan loading
    document.getElementById('resiLoading').classList.remove('hidden');
    document.getElementById('resiError').classList.add('hidden');
    document.getElementById('resiResult').classList.add('hidden');
    
    try {
        // Panggil API route untuk cek resi
        const response = await fetch('/api/check-resi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resi: resiNumber,
                courier: courier
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Gagal memeriksa resi');
        }
        
        if (data.status) {
            // Tampilkan hasil resi
            displayResiResult(data.data);
        } else {
            showResiError(data.error || 'Resi tidak ditemukan');
        }
    } catch (error) {
        console.error('Error checking resi:', error);
        showResiError('Terjadi kesalahan saat memeriksa resi: ' + error.message);
    } finally {
        // Sembunyikan loading
        document.getElementById('resiLoading').classList.add('hidden');
    }
});

function displayResiResult(data) {
    document.getElementById('resiCourier').textContent = data.courier;
    document.getElementById('resiNumberDisplay').textContent = data.resi;
    document.getElementById('resiStatus').textContent = data.status;
    document.getElementById('resiMessage').textContent = data.message;
    
    // Tampilkan riwayat pengiriman
    const historyContainer = document.getElementById('resiHistory');
    historyContainer.innerHTML = '';
    
    if (data.history && data.history.length > 0) {
        data.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'resi-timeline-item';
            historyItem.innerHTML = `
                <div class="bg-primary-50 rounded-lg p-3">
                    <p class="text-sm font-semibold text-primary-700">${item.datetime}</p>
                    <p class="text-primary-600 mt-1">${item.description}</p>
                </div>
            `;
            historyContainer.appendChild(historyItem);
        });
    } else {
        historyContainer.innerHTML = '<p class="text-primary-600">Tidak ada riwayat pengiriman</p>';
    }
    
    // Tampilkan hasil
    document.getElementById('resiResult').classList.remove('hidden');
}

function showResiError(message) {
    const errorElement = document.getElementById('resiError');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    // Sembunyikan setelah 5 detik
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}
