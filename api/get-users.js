// api/get-users.js
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://multitools-page.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      throw new Error(`Gagal mengambil data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Data retrieved successfully');
    
    res.status(200).json({ 
      success: true, 
      users: data.record.users || [] 
    });
    
  } catch (error) {
    console.error('Error in get-users:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
