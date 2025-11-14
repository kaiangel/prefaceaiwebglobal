// pages/api/history.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { openid, page } = req.body;
    
    if (!openid) {
      return res.status(400).json({ code: 1, msg: 'Missing openid parameter' });
    }
    
    // 修改：使用查询参数而不是请求体
    const queryParams = new URLSearchParams();
    queryParams.append('openid', openid);
    queryParams.append('page', page || 1);
    
    // 修改：使用GET请求和查询参数，去掉请求体
    const response = await fetch(`https://www.duyueai.com/history?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
      // 移除body参数
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({ 
      code: 1,
      msg: 'Error fetching history data',
      error: error.message 
    });
  }
}