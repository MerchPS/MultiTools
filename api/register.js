// api/register.js
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://multitools-page.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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
        const { username, email, password, confirmPassword, captchaToken } = JSON.parse(body);
        
        // Validasi input
        if (!username || !email || !password || !confirmPassword) {
          return res.status(400).json({ error: 'Semua field harus diisi' });
        }
        
        if (password !== confirmPassword) {
          return res.status(400).json({ error: 'Password tidak cocok' });
        }
        
        // Validasi email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Format email tidak valid' });
        }
        
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password minimal 6 karakter' });
        }
        
        // Validasi CAPTCHA (jika digunakan)
        if (process.env.RECAPTCHA_SECRET_KEY && (!captchaToken || captchaToken === 'demo-token')) {
          return res.status(400).json({ error: 'CAPTCHA tidak valid' });
        }
        
        // Rate limiting - cek IP address
        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const now = Date.now();
        
        // Konfigurasi JSONBin dari environment variables
        const binId = process.env.JSONBIN_BIN_ID;
        const masterKey = process.env.JSONBIN_MASTER_KEY;
        const accessKey = process.env.JSONBIN_ACCESS_KEY;

        if (!binId || !masterKey || !accessKey) {
          console.error('Missing environment variables');
          return res.status(500).json({ error: 'Server configuration error' });
        }

        // Ambil data yang sudah ada dari JSONBin
        const existingResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          headers: {
            'X-Master-Key': masterKey,
            'X-Access-Key': accessKey,
            'Content-Type': 'application/json'
          }
        });
        
        if (!existingResponse.ok) {
          console.error('JSONBin API error:', existingResponse.status, existingResponse.statusText);
          return res.status(500).json({ 
            error: 'Gagal mengambil data yang sudah ada'
          });
        }
        
        const existingData = await existingResponse.json();
        const currentData = existingData.record || { users: [], sessions: {}, rateLimits: {} };
        
        // Setup rate limiting
        if (!currentData.rateLimits) currentData.rateLimits = {};
        if (!currentData.rateLimits[clientIP]) {
          currentData.rateLimits[clientIP] = { count: 0, lastRequest: now };
        }
        
        // Cek rate limiting (maksimal 3 request per 10 menit per IP)
        const ipLimit = currentData.rateLimits[clientIP];
        if (now - ipLimit.lastRequest < 10 * 60 * 1000) { // 10 menit
          if (ipLimit.count >= 3) {
            return res.status(429).json({ 
              error: 'Terlalu banyak percobaan. Silakan coba lagi setelah 10 menit.' 
            });
          }
          ipLimit.count += 1;
        } else {
          ipLimit.count = 1;
          ipLimit.lastRequest = now;
        }
        
        // Cek apakah username sudah digunakan
        if (currentData.users.some(user => user.username === username)) {
          return res.status(400).json({ error: 'Username sudah digunakan' });
        }
        
        // Cek apakah email sudah digunakan
        if (currentData.users.some(user => user.email === email)) {
          return res.status(400).json({ error: 'Email sudah digunakan' });
        }
        
        // Fungsi hash password
        function hashPassword(password) {
          let hash = 0;
          for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
          }
          return hash.toString();
        }
        
        // Tambahkan user baru
        const newUser = {
          username,
          email,
          password: hashPassword(password),
          createdAt: new Date().toISOString(),
          ip: clientIP,
          userAgent: req.headers['user-agent']
        };
        
        currentData.users.push(newUser);
        
        // Simpan ke JSONBin
        const saveResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
            'X-Access-Key': accessKey
          },
          body: JSON.stringify(currentData)
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('JSONBin API error:', saveResponse.status, errorText);
          return res.status(500).json({ 
            error: 'Gagal menyimpan data',
            message: errorText
          });
        }

        console.log('User registered successfully:', username);
        res.status(200).json({ 
          success: true, 
          message: 'Pendaftaran berhasil! Silakan login.'
        });
      } catch (parseError) {
        console.error('Error parsing request:', parseError);
        res.status(400).json({ error: 'Format data tidak valid' });
      }
    });
  } catch (error) {
    console.error('Error in register:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
