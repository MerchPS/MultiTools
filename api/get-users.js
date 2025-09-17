// api/get-users.js
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Konfigurasi JSONBin dari environment variables
    const binId = process.env.JSONBIN_BIN_ID;
    const masterKey = process.env.JSONBIN_MASTER_KEY;
    const accessKey = process.env.JSONBIN_ACCESS_KEY;

    if (!binId || !masterKey || !accessKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Ambil data dari JSONBin
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
    res.status(200).json({ 
      success: true, 
      users: data.record.users || [] 
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
