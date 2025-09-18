// api/check-resi.js
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
        const { resi, courier } = JSON.parse(body);
        
        if (!resi || !courier) {
          return res.status(400).json({ error: 'Nomor resi dan kurir diperlukan' });
        }

        // Mapping nama kurir ke kode kurir yang digunakan API
        const courierMapping = {
          'Shopee Express': 'SPX',
          'Kurir Rekomendasi Tokopedia': 'TRP',
          'GTL-GoTo Logistics': 'GTL',
          'LEX-Lazada Logistics': 'LEX',
          'JNE': 'JNE',
          'J&T Express': 'JNT',
          'J&T Cargo': 'JNTCARGO',
          'SICEPAT': 'SICEPAT',
          'TIKI': 'TIKI',
          'Pos Indonesia': 'POS',
          'Anteraja': 'ANTERAJA',
          'Lion Parcel': 'LION',
          'Ninja Xpress': 'NINJA',
          'ID Express': 'IDEXPRESS',
          'Wahana': 'WAHANA',
          'Indah Logistik Cargo': 'INDAH',
          'Sentral Cargo': 'SENTRAL',
          'Dakota Cargo': 'DAKOTA',
          'Paxel': 'PAXEL',
          'REX Express': 'REX',
          'JDL Express': 'JDL',
          'NCS Express': 'NCS',
          'SAP Express': 'SAP',
          'International/Luar Negeri': 'INTERNATIONAL',
          'RPX Holding': 'RPX',
          'ARK Xpress': 'ARK',
          'ASP Express': 'ASP',
          'Rosalia Express': 'ROSALIA',
          'Citylink Express': 'CITYLINK',
          'JTL Express': 'JTL',
          '21 Express': 'TWENTYONE',
          'First Logistics': 'FIRST',
          'Star Cargo': 'STAR',
          'KGX press': 'KGX',
          'Standard Express/LWE': 'LWE',
          'Acommerce': 'ACOMMERCE',
          'Janio Asia': 'JANIO',
          'Kerry Express': 'KERRY',
          'EMS': 'EMS',
          'Quantium Solutions': 'QUANTIUM',
          'ESL Express': 'ESL',
          'KGP - Kerta Gaya Pusaka': 'KGP',
          'POSLAJU': 'POSLAJU'
        };

        const courierCode = courierMapping[courier] || courier;

        // Panggil API eksternal melalui server (bukan langsung dari client)
        const apiResponse = await fetch(`https://api.siputzx.my.id/api/check/resi?resi=${encodeURIComponent(resi)}&courier=${encodeURIComponent(courierCode)}`, {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'user-agent': 'SecureSystem/1.0'
          }
        });

        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        
        // Kirim response ke client
        res.status(200).json(apiData);
        
      } catch (parseError) {
        console.error('Error parsing request:', parseError);
        res.status(400).json({ error: 'Format data tidak valid' });
      }
    });
  } catch (error) {
    console.error('Error in check-resi:', error.message);
    res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      message: error.message 
    });
  }
};
