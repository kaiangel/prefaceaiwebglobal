import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/History.module.css';

export default function History() {
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');

  // Check login status
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      loadRecords();
    }
  }, [user, router]);

  // Show copy success message temporarily
  useEffect(() => {
    if (copyMessage) {
      const timer = setTimeout(() => {
        setCopyMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copyMessage]);

  // Load records from API
  const loadRecords = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      if (!user || !user.openid) {
        throw new Error('Login status error');
      }
      
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openid: user.openid,
          page: page
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 0 && Array.isArray(data.data)) {
        const formattedRecords = data.data.map(record => ({
          id: record.prompt_id,
          createTime: record.created_at.split(' ')[0], // Just keep the date part
          input: record.content,
          result: record.response,
          isFavorite: record.is_fav === 1
        }));
        
        setRecords(prev => [...prev, ...formattedRecords]);
        setPage(prev => prev + 1);
        setHasMore(formattedRecords.length > 0);
      } else {
        // Handle error case
        console.error('Failed to load records:', data.msg);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading records:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Show detail modal
  const showDetail = (index) => {
    setCurrentItem(records[index]);
    setShowDetailModal(true);
  };

  // Close detail modal
  const closeDetail = () => {
    setShowDetailModal(false);
    setCurrentItem(null);
  };

  // Copy content to clipboard
  const copyContent = (content) => {
    if (!content) {
      setCopyMessage('No content to copy');
      return;
    }
    
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopyMessage('Copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        setCopyMessage('Failed to copy');
      });
  };

  // Toggle favorite status
  const toggleFavorite = async (index, e) => {
    e.stopPropagation();
    const item = records[index];
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openid: user.openid,
          promptId: item.id,
          action: item.isFavorite ? 'remove' : 'add'
        }),
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        // Update the record locally
        const updatedRecords = [...records];
        updatedRecords[index].isFavorite = !item.isFavorite;
        setRecords(updatedRecords);
      } else {
        console.error('Failed to update favorite status:', data.msg);
      }
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  };

  // Handle scroll to load more
  const handleScroll = (e) => {
    if (loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadRecords();
    }
  };

  if (!user) {
    return null; // Wait for redirect
  }

  return (
    <>
      <Head>
        <title>History - Preface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <Navbar />
      
      <div className={styles.historyContainer}>
        <div className={styles.contentWrapper}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>History</h1>
          </div>
          
          {/* Records list */}
          <div 
            className={styles.recordsList}
            onScroll={handleScroll}
          >
            {/* Loading state */}
            {loading && records.length === 0 && (
              <div className={styles.loadingState}>
                <svg className={styles.loadingIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Loading...</p>
              </div>
            )}
            
            {/* Empty state */}
            {!loading && records.length === 0 && (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V8C21 6.93913 20.5786 5.92172 19.8284 5.17157C19.0783 4.42143 18.0609 4 17 4H7C5.93913 4 4.92172 4.42143 4.17157 5.17157C3.42143 5.92172 3 6.93913 3 8V16C3 17.0609 3.42143 18.0783 4.17157 18.8284C4.92172 19.5786 5.93913 20 7 20H17C18.0609 20 19.0783 19.5786 19.8284 18.8284C20.5786 18.0783 21 17.0609 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>No history records</p>
              </div>
            )}
            
            {/* Records items */}
            {records.map((item, index) => (
              <div 
                key={item.id} 
                className={styles.recordItem}
                onClick={() => showDetail(index)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemDate}>{item.createTime}</span>
                  <button 
                    className={styles.favoriteBtn}
                    onClick={(e) => toggleFavorite(index, e)}
                  >
                    <svg 
                      className={`${styles.favoriteIcon} ${item.isFavorite ? styles.active : ''}`} 
                      viewBox="0 0 24 24" 
                      fill={item.isFavorite ? 'currentColor' : 'none'} 
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
            
            {/* Loading more indicator */}
            {loading && records.length > 0 && (
              <div className={styles.loadingMore}>
                <svg className={styles.loadingIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Loading more...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Detail modal */}
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
        
        {/* Copy message toast */}
        {copyMessage && (
          <div className={styles.toast}>
            {copyMessage}
          </div>
        )}
      </div>
    </>
  );
}