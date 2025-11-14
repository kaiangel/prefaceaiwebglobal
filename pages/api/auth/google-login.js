// pages/api/auth/google-login.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      const { thirdPartyId, email } = req.body;
      
      // Forward the request to the external API
      const response = await fetch('https://www.duyueai.com/user/3th-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          '3th_id': thirdPartyId,
          'email': email
        }),
      });
      
      // Get the response data
      const data = await response.json();
      
      // Return the response to the client
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('Proxy error:', error);
      return res.status(500).json({ 
        message: 'Error proxying request to external API',
        error: error.message 
      });
    }
  }