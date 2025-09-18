// api/get-users.js
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
        const { authToken } = JSON.parse(body);
        
        // Validasi auth token
        if (!authToken || authToken !== process.env.API_AUTH_TOKEN) {
          console.error('Invalid auth token');
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Token autentikasi tidak valid' 
          });
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
        
        // Hapus informasi sensitif sebelum mengirim response
        const sanitizedUsers = data.record.users.map(user => {
          return {
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
          };
          // Password sengaja dihilangkan dari response
        });
        
        res.status(200).json({ 
          success: true, 
          users: sanitizedUsers 
        });
        
      } catch (parseError) {
        console.error('Error parsing request:', parseError);
        res.status(400).json({ error: 'Format data tidak valid' });
      }
    });
  } catch (error) {
    console.error('Error in get-users:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server internal'
    });
  }
};
