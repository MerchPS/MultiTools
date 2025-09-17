// api/save-users.js
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { users } = req.body;
    
    // Validasi data
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ error: 'Data tidak valid' });
    }

    // Konfigurasi JSONBin dari environment variables
    const binId = process.env.JSONBIN_BIN_ID;
    const masterKey = process.env.JSONBIN_MASTER_KEY;
    const accessKey = process.env.JSONBIN_ACCESS_KEY;

    if (!binId || !masterKey || !accessKey) {
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
      const error = await response.text();
      throw new Error(`Gagal menyimpan data: ${error}`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Data berhasil disimpan' 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
