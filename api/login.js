// api/login.js
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password diperlukan' });
    }

    // Konfigurasi JSONBin
    const binId = process.env.JSONBIN_BIN_ID;
    const masterKey = process.env.JSONBIN_MASTER_KEY;
    const accessKey = process.env.JSONBIN_ACCESS_KEY;

    // Ambil data pengguna
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        'X-Master-Key': masterKey,
        'X-Access-Key': accessKey
      }
    });
    
    if (!response.ok) {
      throw new Error('Gagal mengambil data');
    }
    
    const data = await response.json();
    const users = data.record.users || [];
    
    // Cari pengguna
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    // Verifikasi password (gunakan fungsi hash yang sama)
    function hashPassword(password) {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return hash.toString();
    }
    
    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    // Buat session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
    
    // Simpan session (dalam production, gunakan database sessions)
    const sessions = data.record.sessions || {};
    sessions[sessionToken] = {
      username: user.username,
      expiry: sessionExpiry
    };
    
    // Update data di JSONBin
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
    
    // Kirim response dengan session token
    res.status(200).json({ 
      success: true,
      sessionToken,
      user: {
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
