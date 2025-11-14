import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import styles from '../styles/Index.module.css';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [fullContent, setFullContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentPromptId, setCurrentPromptId] = useState(null);
  
  // 重要：删除bufferContent状态，用字符队列替代
  const charQueueRef = useRef([]);
  const isTypingActiveRef = useRef(false);
  const typingSpeed = 23; // 毫秒/字符 - 调整为适合的速度
  
  const typingTimerRef = useRef(null);
  const resultRef = useRef(null);
  const lastDataTimeRef = useRef(Date.now());
  const abortControllerRef = useRef(null);
  const generationCompleteRef = useRef(false);

  // 监听状态变化，确保UI一致性
  useEffect(() => {
    if (!isGenerating && result) {
      console.log("强制确认生成已完成");
      // 不在这里设置showCursor=false
      // 让它在打字队列处理完成后自动处理
      generationCompleteRef.current = true;
    }
  }, [isGenerating, result]);

  // 检查登录状态
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // 处理输入变化
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // 生成提示词
  const handleGeneratePrompt = async () => {
    if (!inputText.trim()) {
      alert('Please enter some content');
      return;
    }

    if (!user || !user.openid) {
      console.error('No openid found, need to login again');
      router.push('/login');
      return;
    }

    // 重置状态
    setIsGenerating(true);
    setResult(formatResult(''));
    setShowResult(false);
    setFullContent('');
    setShowCursor(true);
    lastDataTimeRef.current = Date.now();
    generationCompleteRef.current = false;
    // 清空字符队列
    charQueueRef.current = [];
    isTypingActiveRef.current = false;

    // 创建AbortController用于取消请求
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openid: user.openid,
          content: inputText
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // 处理数据流
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          // 直接调用完成函数
          finishGenerationWhenQueueEmpty();
          break;
        }
        
        // 更新最后接收数据的时间
        lastDataTimeRef.current = Date.now();
        
        // 解码接收到的数据块
        const chunk = decoder.decode(value, { stream: true });
        console.log(`Received chunk: ${chunk.length > 50 ? chunk.substring(0, 50) + '...' : chunk}`);
        
        // 处理数据块
        buffer += chunk;
        buffer = processBuffer(buffer);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
      } else {
        console.error('Error in stream processing:', error);
        handleError(`Generation failed: ${error.message}`);
      }
    }
  };

  // 处理缓冲区
  const processBuffer = (buffer) => {
    try {
      // 查找可能的JSON对象
      let processedUpTo = 0;
      let jsonStartPos = buffer.indexOf('{');
      
      while (jsonStartPos !== -1) {
        try {
          // 尝试解析JSON
          let bracketCount = 1;
          let jsonEndPos = -1;
          
          for (let i = jsonStartPos + 1; i < buffer.length; i++) {
            if (buffer[i] === '{') {
              bracketCount++;
            } else if (buffer[i] === '}') {
              bracketCount--;
              if (bracketCount === 0) {
                jsonEndPos = i;
                break;
              }
            }
          }
          
          if (jsonEndPos !== -1) {
            const jsonStr = buffer.substring(jsonStartPos, jsonEndPos + 1);
            try {
              const jsonData = JSON.parse(jsonStr);
              console.log("Parsed JSON data:", jsonData);
              processJsonData(jsonData);
            } catch (jsonError) {
              console.error('JSON parse error:', jsonError, 'for string:', jsonStr);
            }
            
            processedUpTo = jsonEndPos + 1;
            jsonStartPos = buffer.indexOf('{', processedUpTo);
          } else {
            break; // 没有找到完整的JSON
          }
        } catch (parseError) {
          console.error('Error parsing potential JSON:', parseError);
          processedUpTo = jsonStartPos + 1;
          jsonStartPos = buffer.indexOf('{', processedUpTo);
        }
      }
      
      // 更新缓冲区
      return processedUpTo > 0 ? buffer.substring(processedUpTo) : buffer;
    } catch (error) {
      console.error('Error in processBuffer:', error);
      return buffer;
    }
  };

  // 处理JSON数据
  const processJsonData = (jsonData) => {
    // 检查服务器错误响应
    if (jsonData.code !== undefined && jsonData.code !== 0) {
      // 如果服务器返回错误码
      console.error('Server returned error:', jsonData);
      const errorMessage = jsonData.msg || `Error code: ${jsonData.code}`;
      handleError(errorMessage);
      return;
    }
    
    // 处理ID
    if (jsonData.id && !currentPromptId) {
      setCurrentPromptId(jsonData.id);
    }
    
    // 处理不同格式的响应数据
    if (jsonData.choices && jsonData.choices.length > 0) {
      const choice = jsonData.choices[0];
      
      if (choice.delta && choice.delta.content) {
        // 将内容添加到字符队列
        addToCharQueue(choice.delta.content);
      }
      
      // 当收到结束信号
      if (choice.finish_reason === 'stop') {
        console.log("Received stop signal, finishing generation");
        finishGenerationWhenQueueEmpty();
      }
    } else if (jsonData.content) {
      // 如果直接有content字段
      addToCharQueue(jsonData.content);
    } else if (jsonData.msg && typeof jsonData.msg === 'string') {
      // 如果有msg字段且是字符串
      addToCharQueue(jsonData.msg);
    }
  };

  // 新的函数：将文本添加到字符队列
  const addToCharQueue = (text) => {
    // 将文本的每个字符推入队列
    for (let char of text) {
      charQueueRef.current.push(char);
    }
    
    // 如果是首次内容，显示结果区域
    if (fullContent === '') {
      setShowResult(true);
    }
    
    // 如果打字效果没有运行，启动它
    if (!isTypingActiveRef.current) {
      startTypingFromQueue();
    }
    
    // 检查是否应该显示箭头
    setTimeout(checkScrollArrow, 300);
  };

  // 全新的打字效果函数
  const startTypingFromQueue = () => {
    if (isTypingActiveRef.current) return;
    
    isTypingActiveRef.current = true;
    setShowCursor(true);
    
    const processQueue = () => {
      // 如果队列中有字符
      if (charQueueRef.current.length > 0) {
        // 取出一个字符
        const char = charQueueRef.current.shift();
        
        // 更新显示的内容
        setFullContent(prev => {
          const newContent = prev + char;
          // 格式化并更新结果
          setResult(formatResult(newContent));
          return newContent;
        });
        
        // 安排下一个字符的处理
        typingTimerRef.current = setTimeout(processQueue, typingSpeed);
      } else {
        // 队列为空
        if (isGenerating) {
          // 如果仍在生成中，暂停打字但保持激活状态
          isTypingActiveRef.current = true;
          typingTimerRef.current = setTimeout(processQueue, 50);
        } else {
          // 如果生成结束，完全停止打字效果
          isTypingActiveRef.current = false;
          setShowCursor(false);
        }
      }
    };
    
    // 开始处理队列
    processQueue();
  };

  // 滚动到底部
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
    
    if (!isGenerating) {
      setTimeout(() => {
        setShowScrollArrow(false);
      }, 500);
    }
  };

  // 检查是否显示滚动箭头
  const checkScrollArrow = () => {
    if (showResult && (isGenerating || (result && result.sections && result.sections.length > 0))) {
      setShowScrollArrow(true);
    }
  };

  // 修改的完成生成函数
  const finishGenerationWhenQueueEmpty = () => {
    // 设置生成结束标志
    setIsGenerating(false);
    
    // 不立即隐藏光标
    // 等待字符队列处理完再隐藏
    
    // 检查字符队列是否已空
    const checkQueueEmpty = () => {
      if (charQueueRef.current.length === 0) {
        // 队列已空，完全结束打字效果
        isTypingActiveRef.current = false;
        setShowCursor(false);
        
        // 显示滚动箭头
        setShowScrollArrow(true);
      } else {
        // 队列未空，继续等待
        setTimeout(checkQueueEmpty, 100);
      }
    };
    
    // 开始检查队列
    checkQueueEmpty();
  };

  // 原始的finishGeneration函数，供直接调用
  const finishGeneration = () => {
    if (!isGenerating) return;
    
    console.log("finishGeneration执行");
    
    // 清除计时器
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // 设置状态
    setIsGenerating(false);
    
    // 不在这里设置打字状态
    // 等待队列处理完
  };

  // 处理错误
  const handleError = (message) => {
    // 清除计时器
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // 更新状态
    setIsGenerating(false);
    setShowResult(true);
    isTypingActiveRef.current = false;
    setShowCursor(false);
    charQueueRef.current = []; // 清空队列
    
    // 显示错误消息
    setResult({
      sections: [{
        title: '',
        content: [`Generation failed: ${message}`]
      }]
    });
    
    alert(message);
  };

  // 复制内容
  const handleCopy = () => {
    if (!fullContent) {
      alert('No content to copy');
      return;
    }
    
    navigator.clipboard.writeText(fullContent)
      .then(() => {
        alert('Content copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy content');
      });
  };

  // 切换收藏状态
  const toggleFavorite = async () => {
    // 如果没有promptId，无法进行收藏操作
    if (!currentPromptId) {
      console.warn('无法收藏：缺少promptId');
      return;
    }

    try {
      // 根据当前状态决定是添加还是删除收藏
      const action = isFavorited ? 'remove' : 'add';
      
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openid: user.openid,
          promptId: currentPromptId,
          action: action,
          content: fullContent  // 添加内容，用于匹配历史记录
        }),
      });
      
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 0) {
        // 操作成功，仅更新UI状态，移除弹窗提示
        setIsFavorited(!isFavorited);
        // 移除了这里的alert消息
      } else {
        // 服务器返回错误
        throw new Error(data.msg || '操作失败');
      }
    } catch (error) {
      console.error('收藏操作错误:', error);
      alert(`收藏操作失败: ${error.message}`);
    }
  };

  // 格式化结果
  const formatResult = (rawResult) => {
    if (!rawResult || rawResult.trim() === '') {
      return { sections: [] };
    }

    const sections = rawResult.split('\n\n').filter(s => s.trim());
    const formattedResult = { sections: [] };
  
    sections.forEach((section) => {
      if (section.includes(':')) {
        const [title, ...contentParts] = section.split(':');
        const content = contentParts.join(':').trim()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);
        
        formattedResult.sections.push({
          title: title.trim(),
          content: content
        });
      } else {
        const content = section.trim()
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);
        
        formattedResult.sections.push({
          title: '',
          content: content
        });
      }
    });

    return formattedResult;
  };
  
  // 停止生成
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    // 立即停止所有状态
    setIsGenerating(false);
    isTypingActiveRef.current = false;
    setShowCursor(false);
    charQueueRef.current = []; // 清空队列
    
    alert('Generation stopped');
  };

  return (
    <>
      <Head>
        <title>Preface - AI Enhanced Prompts</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <Navbar />
      
      <main className={styles.container}>
        {/* Header area */}
        <div className={styles.headerContainer}>
          <h1 className={styles.title}>Preface</h1>
          <div className={styles.titleUnderline}></div>
          <p className={styles.subtitle}>When you want AI to think like you...</p>
        </div>
        
        {/* Input area */}
        <div className={styles.inputContainer}>
          <textarea 
            className={styles.textarea}
            placeholder="Write down any idea, and with one click, transform it into an enhanced prompt for AI communication! (Examples: I need to write a sick leave email / I want to create a restaurant review for social media / I want to develop a weekly weight loss plan...)"
            value={inputText}
            onChange={handleInputChange}
          />
        </div>
        
        {/* Button area */}
        <div className={styles.buttonContainer}>
          <button 
            className={styles.button}
            onClick={isGenerating ? stopGeneration : handleGeneratePrompt}
            disabled={!inputText || (!inputText.trim() && !isGenerating)}
          >
            <svg 
              className={styles.buttonIcon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            {isGenerating ? 'Generating...' : 'Spark Inspiration'}
          </button>
        </div>
        
        {/* Result area */}
        {result && (
          <div 
            ref={resultRef}
            className={`${styles.resultContainer} ${showResult ? styles.resultContainerVisible : ''}`}
          >
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-xl font-semibold text-green-600">Enhanced Prompt</h2>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={toggleFavorite}
                    className="focus:outline-none"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill={isFavorited ? "#43B692" : "none"}
                      stroke={isFavorited ? "#43B692" : "#718096"}
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="focus:outline-none"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#718096" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              {result.sections.map((section, index) => (
                <div key={index} className="mb-5 last:mb-0">
                  {section.title && (
                    <h3 className="text-lg text-green-600 font-medium mb-2">{section.title}</h3>
                  )}
                  <div>
                    {section.content.map((line, idx) => (
                      <p key={idx} className="text-gray-800 my-1.5 leading-relaxed">
                        {line}
                        {index === result.sections.length-1 && 
                         idx === section.content.length-1 && 
                         showCursor && (
                          <span className={styles.typingCursor}></span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Scroll arrow */}
        {showScrollArrow && (
          <div 
            className={`${styles.scrollArrow} ${showScrollArrow ? styles.scrollArrowVisible : ''}`}
            onClick={scrollToBottom}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        )}
      </main>
    </>
  );
}