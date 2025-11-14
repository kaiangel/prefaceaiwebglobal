// pages/api/favorites.js
export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return handleGetFavorites(req, res);
    case 'POST':
      return handlePostFavorite(req, res);
    default:
      return res.status(405).json({ code: 1, msg: 'Method not allowed' });
  }
}

async function handleGetFavorites(req, res) {
  try {
    const { openid, page } = req.query;
    
    if (!openid) {
      return res.status(400).json({ code: 1, msg: '缺少 openid 参数' });
    }
    
    const queryParams = new URLSearchParams();
    queryParams.append('openid', openid);
    if (page) queryParams.append('page', page);
    
    const response = await fetch(`https://www.duyueai.com/my_favorites?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败，状态码：${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    return res.status(500).json({ 
      code: 1,
      msg: '获取收藏列表失败',
      error: error.message 
    });
  }
}

async function handlePostFavorite(req, res) {
  try {
    let { openid, promptId, action } = req.body;
    
    if (!openid || !promptId || !action) {
      return res.status(400).json({ 
        code: 1, 
        msg: '缺少必要参数' 
      });
    }
    
    // 处理字符串ID的情况，尝试查找对应的数值型历史ID
    if (typeof promptId === 'string' && promptId.includes('chatcmpl-')) {
      console.log(`接收到字符串ID: ${promptId}，尝试获取数值型历史ID`);
      
      // 直接调用外部API获取历史记录
      const queryParams = new URLSearchParams();
      queryParams.append('openid', openid);
      queryParams.append('page', 1);
      
      try {
        // 直接访问外部API而非通过自己的API路由
        const historyResponse = await fetch(`https://www.duyueai.com/history?${queryParams.toString()}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.code === 0 && Array.isArray(historyData.data)) {
            // 找到最新的记录并使用其ID
            if (historyData.data.length > 0) {
              promptId = historyData.data[0].prompt_id;
              console.log(`成功获取数值型历史ID: ${promptId}`);
            }
          }
        } else {
          console.error(`获取历史记录失败: ${historyResponse.status}`);
        }
      } catch (historyError) {
        console.error('获取历史记录出错:', historyError);
      }
    }
    
    const endpoint = action === 'add' ? 'favorite' : 'unfavorite';
    
    console.log(`发送请求到 ${endpoint} 接口，参数:`, {
      openid,
      prompt_id: promptId
    });
    
    // 关键修改：使用JSON格式而非表单格式
    const response = await fetch(`https://www.duyueai.com/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',  // 修改为application/json
        'Accept': 'application/json'
      },
      // 直接发送JSON数据，注意参数名称为prompt_id
      body: JSON.stringify({
        openid: openid,
        prompt_id: promptId
      })
    });
    
    // 处理响应...
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = '无法读取错误响应';
      }
      console.error(`API错误响应(${response.status}):`, errorText);
      throw new Error(`API 请求失败，状态码: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('收藏操作错误:', error);
    return res.status(500).json({ 
      code: 1,
      msg: '更新收藏状态失败',
      error: error.message 
    });
  }
}