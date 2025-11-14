import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Favorites.module.css';

export default function Favorites() {
  const router = useRouter();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');

  // 检查登录状态
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      loadFavorites();
    }
  }, [user, router]);

  // 显示复制成功消息
  useEffect(() => {
    if (copyMessage) {
      const timer = setTimeout(() => {
        setCopyMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copyMessage]);

  // 加载收藏列表
  const loadFavorites = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      if (!user || !user.openid) {
        throw new Error('Login status error');
      }
      
      // 构建查询参数
      const queryParams = new URLSearchParams();
      queryParams.append('openid', user.openid);
      queryParams.append('page', page);
      
      const response = await fetch(`/api/favorites?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.code === 0 && Array.isArray(data.data)) {
        // 格式化数据
        const formattedRecords = data.data.map(record => ({
          id: record.id,
          createTime: record.created_at.split(' ')[0], // 只保留日期部分
          input: record.content,
          result: record.response,
          isFavorite: true // 因为是收藏列表，所以默认为已收藏
        }));
        
        setFavorites(prev => [...prev, ...formattedRecords]);
        setPage(prev => prev + 1);
        setHasMore(formattedRecords.length > 0);
      } else {
        // 处理错误情况
        console.error('Failed to load favorites:', data.msg);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // 显示详情模态框
  const showDetail = (index) => {
    setCurrentItem(favorites[index]);
    setShowDetailModal(true);
  };

  // 关闭详情模态框
  const closeDetail = () => {
    setShowDetailModal(false);
    setCurrentItem(null);
  };

  // 复制内容到剪贴板
  const copyContent = (content) => {
    if (!content) {
      setCopyMessage('Empty Content');
      return;
    }
    
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopyMessage('Copied to Clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        setCopyMessage('Copy Failed');
      });
  };

  // 取消收藏
  const removeFavorite = async (index, e) => {
    e.stopPropagation();
    const item = favorites[index];
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openid: user.openid,
          promptId: item.id,
          action: 'remove'
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        // 在本地更新状态，移除该条目
        const updatedFavorites = [...favorites];
        updatedFavorites.splice(index, 1);
        setFavorites(updatedFavorites);
      } else {
        console.error('Failed to remove favorite:', data.msg);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // 处理滚动加载更多
  const handleScroll = (e) => {
    if (loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadFavorites();
    }
  };

  if (!user) {
    return null; // 等待重定向
  }

  return (
    <>
      <Head>
        <title>Favorites - Preface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <Navbar />
      
      <div className={styles.favoritesContainer}>
        <div className={styles.contentWrapper}>
          {/* 页面标题 */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Favorites</h1>
          </div>
          
          {/* 收藏列表 */}
          <div 
            className={styles.favoritesList}
            onScroll={handleScroll}
          >
            {/* 加载状态 */}
            {loading && favorites.length === 0 && (
              <div className={styles.loadingState}>
                <svg className={styles.loadingIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Loading...</p>
              </div>
            )}
            
            {/* 空状态 */}
            {!loading && favorites.length === 0 && (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Oops! Empty</p>
                <button 
                  className={styles.emptyButton}
                  onClick={() => router.push('/')}
                >
                  Go Create
                </button>
              </div>
            )}
            
            {/* 收藏项目列表 */}
            {favorites.map((item, index) => (
              <div 
                key={item.id} 
                className={styles.favoriteItem}
                onClick={() => showDetail(index)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemDate}>{item.createTime}</span>
                  <button 
                    className={styles.favoriteBtn}
                    onClick={(e) => removeFavorite(index, e)}
                    title="取消收藏"
                  >
                    <svg 
                      className={styles.favoriteIcon} 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.itemContent}>
                  <p className={styles.contentPreview}>{item.input}</p>
                </div>
              </div>
            ))}
            
            {/* 加载更多指示器 */}
            {loading && favorites.length > 0 && (
              <div className={styles.loadingMore}>
                <svg className={styles.loadingIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>More...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 详情模态框 */}
        {showDetailModal && (
          <div className={styles.modalOverlay} onClick={closeDetail}>
            <div 
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Prompt Details</h2>
                <button 
                  className={styles.closeButton}
                  onClick={closeDetail}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.promptSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Original Prompt</h3>
                    <button 
                      className={styles.copyButton}
                      onClick={() => copyContent(currentItem.input)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <p className={styles.promptContent}>{currentItem.input}</p>
                </div>
                
                <div className={styles.promptSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Enhanced Prompt</h3>
                    <button 
                      className={styles.copyButton}
                      onClick={() => copyContent(currentItem.result)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <p className={styles.promptContent}>{currentItem.result}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 复制消息提示 */}
        {copyMessage && (
          <div className={styles.toast}>
            {copyMessage}
          </div>
        )}
      </div>
    </>
  );
}