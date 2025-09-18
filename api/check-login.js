// api/check-login.js
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://multitools-page.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        
        if (!username || !password) {
          return res.status(400).json({ error: 'Username dan password diperlukan' });
        }

        // Konfigurasi JSONBin dari environment variables
        const binId = process.env.JSONBIN_BIN_ID;
        const masterKey = process.env.JSONBIN_MASTER_KEY;
        const accessKey = process.env.JSONBIN_ACCESS_KEY;

        if (!binId || !masterKey || !accessKey) {
          console.error('Missing environment variables');
          return res.status(500).json({ error: 'Server configuration error' });
        }

        // Ambil data dari JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          headers: {
            'X-Master-Key': masterKey,
            'X-Access-Key': accessKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('JSONBin API error:', response.status, response.statusText);
          return res.status(500).json({ 
            error: 'Gagal mengambil data dari penyimpanan'
          });
        }
        
        const data = await response.json();
        const users = data.record.users || [];
        
        // Fungsi hash password (harus sama dengan yang digunakan di frontend)
        function hashPassword(password) {
          let hash = 0;
          for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
          }
          return hash.toString();
        }
        
        // Cari pengguna dengan username yang sesuai
        const user = users.find(u => u.username === username);
        
        if (!user) {
          return res.status(401).json({ error: 'Username tidak ditemukan' });
        }
        
        // Verifikasi password
        if (user.password !== hashPassword(password)) {
          return res.status(401).json({ error: 'Password salah' });
        }
        
        // Login berhasil - buat session token
        const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        
        // Simpan session (dalam production, gunakan database yang lebih aman)
        const sessions = data.record.sessions || {};
        sessions[sessionToken] = {
          username: user.username,
          expiry: sessionExpiry
        };
        
        // Update data di JSONBin (hanya jika perlu menyimpan session)
        await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
            'X-Access-Key': accessKey
          },
          body: JSON.stringify({ 
            users,
            sessions 
          })
        });
        
        // Kirim response sukses tanpa data sensitif
        res.status(200).json({ 
          success: true,
          message: 'Login berhasil',
          sessionToken,
          user: {
            username: user.username,
            email: user.email
          }
        });
        
      } catch (parseError) {
        console.error('Error parsing request:', parseError);
        res.status(400).json({ error: 'Format data tidak valid' });
      }
    });
  } catch (error) {
    console.error('Error in check-login:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server internal'
    });
  }
};
