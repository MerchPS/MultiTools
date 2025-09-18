// api/save-users.js
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
        const { users, authToken, action = 'add' } = JSON.parse(body);
        
        // Validasi auth token
        if (!authToken || authToken !== process.env.API_AUTH_TOKEN) {
          console.error('Invalid auth token');
          return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Token autentikasi tidak valid' 
          });
        }
        
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
        const currentData = existingData.record || { users: [], sessions: {} };
        
        // Proses data berdasarkan action
        if (action === 'add') {
          // Tambahkan user baru ke data yang sudah ada
          currentData.users = [...currentData.users, ...users];
        } else if (action === 'replace') {
          // Ganti seluruh data users
          currentData.users = users;
        } else if (action === 'update') {
          // Update user yang sudah ada
          users.forEach(newUser => {
            const index = currentData.users.findIndex(u => u.username === newUser.username);
            if (index !== -1) {
              currentData.users[index] = { ...currentData.users[index], ...newUser };
            } else {
              currentData.users.push(newUser);
            }
          });
        }
        
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

        console.log('Data saved successfully');
        res.status(200).json({ 
          success: true, 
          message: 'Data berhasil disimpan',
          count: currentData.users.length
        });
      } catch (parseError) {
        console.error('Error parsing request:', parseError);
        res.status(400).json({ error: 'Format data tidak valid' });
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
