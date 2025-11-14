// pages/api/stream.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      const { openid, content } = req.body;
      console.log(`Processing request for openid: ${openid}, content: ${content?.substring(0, 50)}...`);
      
      // 确保请求包含openid
      if (!openid) {
        return res.status(400).json({ code: 1, msg: '缺少openid参数' });
      }
      
      // 在stream.js中确保这段代码正确
      const formData = new URLSearchParams();
      formData.append('openid', openid); // 确保openid存在且正确
      formData.append('content', content);

      // 记录请求内容以便调试
      console.log(`Sending request to external API with openid: ${openid}, content length: ${content.length}`);
      
      // 转发请求到外部API
      const response = await fetch('https://www.duyueai.com/botPromptStream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; PrefaceAI/1.0)',
        },
        body: formData
      });
  
      console.log(`External API response status: ${response.status}`);
      
      // 记录响应头信息
      const responseHeaders = Object.fromEntries(response.headers);
      console.log('Response headers:', responseHeaders);
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      // 获取并处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let isFirstChunk = true;
      
      // 流式传输数据到客户端
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed from external API');
          break;
        }
        
        // 解码并记录数据
        const chunk = decoder.decode(value, { stream: true });
        if (isFirstChunk) {
          console.log(`First chunk received: ${chunk.substring(0, 200)}...`);
          isFirstChunk = false;
        } else {
          console.log(`Received chunk of size: ${value.length} bytes`);
        }
        
        // 处理数据格式差异 (如果需要)
        let processedChunk = chunk;
        
        try {
          // 尝试解析JSON (如果是JSON格式)
          if (chunk.trim().startsWith('{') && chunk.trim().endsWith('}')) {
            const jsonData = JSON.parse(chunk);
            
            // 检查是否有错误码
            if (jsonData.code && jsonData.code !== 0) {
              console.warn(`Received error response: code=${jsonData.code}, msg=${jsonData.msg}`);
              // 将错误信息转换为客户端可以处理的格式
              processedChunk = JSON.stringify({
                choices: [{
                  delta: { content: `Error: ${jsonData.msg || 'Unknown error'}` },
                  finish_reason: "stop"
                }]
              });
            } else if (jsonData.content || jsonData.msg) {
              // 转换响应格式为客户端期望的格式
              processedChunk = JSON.stringify({
                choices: [{
                  delta: { content: jsonData.content || jsonData.msg },
                  finish_reason: null
                }]
              });
            }
          }
        } catch (parseError) {
          console.warn('Error parsing chunk as JSON:', parseError);
          // 非JSON或解析失败，保持原样发送
        }
        
        // 将处理后的数据发送到客户端
        res.write(processedChunk);
        
        // 刷新缓冲区以确保数据立即发送
        if (res.flush) {
          res.flush();
        }
      }
      
      // 确保发送最终的完成标记
      res.write(JSON.stringify({
        choices: [{ finish_reason: "stop" }]
      }));
      
      // 完成响应
      res.end();
      console.log('Response completed');
      
    } catch (error) {
      console.error('Proxy error:', error);
      
      // 如果响应已经开始，我们不能发送错误状态
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: 'Error proxying request to external API',
          error: error.message 
        });
      } else {
        // 如果已经开始发送响应，尝试在流中发送错误信息
        try {
          // 发送一个客户端可以理解的错误格式
          res.write(JSON.stringify({ 
            choices: [{
              delta: { content: `Error: ${error.message}` },
              finish_reason: "stop"
            }]
          }));
        } catch (writeError) {
          console.error('Error writing error response:', writeError);
        }
        res.end();
      }
    }
  }