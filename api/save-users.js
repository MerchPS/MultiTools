// api/save-users.js
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://multitools-page.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
        const { users } = JSON.parse(body);
        
        // Validasi data
        if (!users || !Array.isArray(users)) {
          return res.status(400).json({ error: 'Data tidak valid' });
        }

        // Konfigurasi JSONBin dari environment variables
        const binId = process.env.JSONBIN_BIN_ID;
        const masterKey = process.env.JSONBIN_MASTER_KEY;
        const accessKey = process.env.JSONBIN_ACCESS_KEY;

        if (!binId || !masterKey || !accessKey) {
          console.error('Missing environment variables');
          return res.status(500).json({ error: 'Server configuration error' });
        }

        // Simpan ke JSONBin
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey,
            'X-Access-Key': accessKey
          },
          body: JSON.stringify({ users })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('JSONBin API error:', response.status, errorText);
          throw new Error(`Gagal menyimpan data: ${response.status} ${errorText}`);
        }

        console.log('Data saved successfully');
        res.status(200).json({ 
          success: true, 
          message: 'Data berhasil disimpan' 
        });
      } catch (parseError) {
        console.error('Error parsing request:', parseError);
        res.status(400).json({ error: 'Invalid JSON format' });
      }
    });
  } catch (error) {
    console.error('Error in save-users:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
