import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Profile.module.css';

export default function Profile() {
  const router = useRouter();
  const { user, logout, login } = useAuth();
  const [usageData, setUsageData] = useState({
    usedPrompts: 45,
    totalPrompts: 100,
    usagePercent: 45
  });
  
  // 新增设置状态
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    content: ''
  });
  
  // Check login status
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.picture) {
      // 如果用户对象中有头像，则使用
      setAvatarFile(user.picture);
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Handle account upgrade
  const handleUpgrade = () => {
    router.push('/payment');
  };
  
  // 图片压缩函数
  const compressImage = (imageDataUrl, maxSizeKB = 100) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageDataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 如果图片过大，按比例缩小
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 压缩质量调整
        let quality = 0.8;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 检查大小，如果仍然过大则继续压缩
        const getSizeInKB = (dataUrl) => {
          // 移除 "data:image/jpeg;base64," 前缀
          const base64Str = dataUrl.split(',')[1];
          // 计算近似大小 (base64编码后的大小约为原始大小的4/3)
          return Math.round((base64Str.length * 3) / 4 / 1024);
        };
        
        // 如果大小超过限制，递减质量继续压缩
        while (getSizeInKB(compressedDataUrl) > maxSizeKB && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        console.log(`图片已压缩，大小约为${getSizeInKB(compressedDataUrl)}KB`);
        resolve(compressedDataUrl);
      };
    });
  };
  
  // Handle avatar click
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle file upload - 修改此函数
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // 添加文件类型验证
      if (file.type.startsWith('image/')) {
        try {
          // 显示加载状态
          setAvatarFile(null); // 临时清空头像以显示加载状态
          
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              // 压缩图片
              const compressedImage = await compressImage(reader.result, 100);
              
              // 设置本地头像显示
              setAvatarFile(compressedImage);
              
              // 更新用户信息并持久化
              if (user) {
                const updatedUser = { ...user, picture: compressedImage };
                login(updatedUser); // 这将会更新localStorage
                console.log('用户头像已更新并保存到localStorage');
              }
            } catch (compressionError) {
              console.error('图片压缩失败:', compressionError);
              alert('处理图片时出错，请选择另一张图片');
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('文件读取错误:', error);
          alert('读取图片失败，请重试');
        }
      } else {
        alert('请选择图片文件 (JPG, PNG等)');
      }
    }
  };
  
  // Upload to server function (example)
  const uploadAvatarToServer = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Assuming you have an API endpoint to handle avatar uploads
      const response = await fetch('/api/update-avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        console.log('Avatar uploaded successfully');
        // May need to update user state
      } else {
        console.error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  // Show modal
  const showContentModal = (title, content) => {
    setModalContent({
      title,
      content
    });
    setShowModal(true);
  };

  // Show help information
  const showHelp = () => {
    showContentModal('Get Help', 'For assistance, please email us at: help@prefaceai.net');
  };

  // Show about information
  const showAbout = () => {
    showContentModal('About Preface', 'Happy Prompting!');
  };

  // Show privacy policy
  const showPrivacyPolicy = () => {
    showContentModal('Privacy Policy', privacyPolicyContent);
  };

  // Show user agreement
  const showUserAgreement = () => {
    showContentModal('User Agreement', userAgreementContent);
  };

  // Go to favorites page
  const goToFavorites = () => {
    router.push('/favorites');
  };

  if (!user) {
    return null; // Wait for redirect
  }

  return (
    <>
      <Head>
        <title>Profile - Preface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <Navbar />
      
      <div className={styles.profileContainer}>
        <div className={styles.contentWrapper}>
          {/* User Info Section */}
          <div className={styles.userInfoSection}>
            <div 
              className={styles.avatarContainer}
              onClick={handleAvatarClick}
              title="Click to upload new avatar"
            >
              {avatarFile ? (
                <img 
                  src={avatarFile} 
                  alt="User Avatar" 
                  className={styles.avatar}
                />
              ) : (
                <img 
                  src="/icons/default-avatar.svg" 
                  alt="Default Avatar" 
                  className={styles.avatar}
                />
              )}
              <div className={styles.avatarOverlay}>
                <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              {/* Hidden file input */}
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className={styles.fileInput}
              />
            </div>
            
            <div className={styles.userInfo}>
              <h1 className={styles.userName}>{user.name || 'User'}</h1>
              <p className={styles.userEmail}>{user.email || 'No email provided'}</p>
            </div>
          </div>
          
          <div className={styles.cardsContainer}>
            <div className={styles.mainColumn}>
              {/* Account Info Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 20C4 17.6131 4.94821 15.3239 6.63604 13.636C8.32387 11.9482 10.6131 11 13 11C15.3869 11 17.6761 11.9482 19.364 13.636C21.0518 15.3239 22 17.6131 22 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2>Account Information</h2>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Account Type</span>
                    <span className={styles.infoValue}>
                      Free Plan
                      {/* <span className={styles.proBadge}>PRO</span> */}
                    </span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Member Since</span>
                    <span className={styles.infoValue}>March 15, 2024</span>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Login Method</span>
                    <span className={styles.infoValue}>Google</span>
                  </div>
                  
                  <button 
                    onClick={handleUpgrade}
                    className={styles.actionButton}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
              
              {/* Usage Statistics Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2>Usage Statistics</h2>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Monthly Prompts</span>
                    <span className={styles.infoValue}>{usageData.usedPrompts}/{usageData.totalPrompts}</span>
                  </div>
                  
                  <div className={styles.usageContainer}>
                    <div className={styles.usageBar}>
                      <div 
                        className={styles.usageProgress} 
                        style={{ width: `${usageData.usagePercent}%` }}
                      ></div>
                    </div>
                    <div className={styles.usageLabel}>
                      <span>{usageData.usagePercent}% used</span>
                      <span>Resets on Apr 1, 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.sideColumn}>
              {/* Settings Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.7389 4.5808 13.8642 4.82578 14.0407 5.032C14.2172 5.23822 14.4399 5.39985 14.6907 5.50375C14.9414 5.60764 15.2132 5.65085 15.4838 5.62987C15.7544 5.60889 16.0162 5.5243 16.248 5.383C17.791 4.443 19.558 6.209 18.618 7.753C18.4769 7.98466 18.3924 8.24634 18.3715 8.51677C18.3506 8.78721 18.3938 9.05877 18.4975 9.30938C18.6013 9.55999 18.7627 9.78258 18.9687 9.95905C19.1747 10.1355 19.4194 10.2609 19.683 10.325C21.439 10.751 21.439 13.249 19.683 13.675C19.4192 13.7389 19.1742 13.8642 18.968 14.0407C18.7618 14.2172 18.6001 14.4399 18.4963 14.6907C18.3924 14.9414 18.3491 15.2132 18.3701 15.4838C18.3911 15.7544 18.4757 16.0162 18.617 16.248C19.557 17.791 17.791 19.558 16.247 18.618C16.0153 18.4769 15.7537 18.3924 15.4832 18.3715C15.2128 18.3506 14.9412 18.3938 14.6906 18.4975C14.44 18.6013 14.2174 18.7627 14.0409 18.9687C13.8645 19.1747 13.7391 19.4194 13.675 19.683C13.249 21.439 10.751 21.439 10.325 19.683C10.2611 19.4192 10.1358 19.1742 9.95929 18.968C9.7828 18.7618 9.56011 18.6001 9.30935 18.4963C9.05859 18.3924 8.78683 18.3491 8.51621 18.3701C8.24559 18.3911 7.98375 18.4757 7.752 18.617C6.209 19.557 4.442 17.791 5.382 16.247C5.5231 16.0153 5.60755 15.7537 5.62848 15.4832C5.64942 15.2128 5.60624 14.9412 5.50247 14.6906C5.3987 14.44 5.23726 14.2174 5.03127 14.0409C4.82529 13.8645 4.58056 13.7391 4.317 13.675C2.561 13.249 2.561 10.751 4.317 10.325C4.5808 10.2611 4.82578 10.1358 5.032 9.95929C5.23822 9.7828 5.39985 9.56011 5.50375 9.30935C5.60764 9.05859 5.65085 8.78683 5.62987 8.51621C5.60889 8.24559 5.5243 7.98375 5.383 7.752C4.443 6.209 6.209 4.442 7.753 5.382C8.753 5.99 10.049 5.452 10.325 4.317Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2>Settings</h2>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Language</span>
                    <div className={styles.languageOptionsContainer}>
                      <span className={styles.selectedLanguage}>English</span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email Notifications</span>
                    <div className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        id="emailNotifications" 
                        className={styles.toggleInput} 
                        checked={emailNotifications}
                        onChange={() => setEmailNotifications(!emailNotifications)}
                      />
                      <label htmlFor="emailNotifications" className={styles.toggleLabel}>
                        <span className={styles.toggleButton}></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* More Features Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <svg className={styles.cardIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2>More Features</h2>
                </div>
                
                <div className={styles.cardContent}>
                  <button onClick={goToFavorites} className={styles.menuItem}>
                    <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>My Favorites</span>
                  </button>
                  
                  <button onClick={showHelp} className={styles.menuItem}>
                    <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.09 9.00002C9.3251 8.33169 9.78915 7.76813 10.4 7.40915C11.0108 7.05018 11.7289 6.91896 12.4272 7.03871C13.1255 7.15847 13.7588 7.52153 14.2151 8.06353C14.6713 8.60554 14.9211 9.29153 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Get Help</span>
                  </button>
                  
                  <button onClick={showAbout} className={styles.menuItem}>
                    <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>About Preface</span>
                  </button>
                  
                  <button onClick={showPrivacyPolicy} className={styles.menuItem}>
                    <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 16L16 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Privacy Policy</span>
                  </button>
                  
                  <button onClick={showUserAgreement} className={styles.menuItem}>
                    <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>User Agreement</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modalContent.title}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              {modalContent.content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const privacyPolicyContent = (
  <div className={styles.policyContent}>
    <h3>Privacy Policy</h3>
    <p>Last Updated: April 14, 2025</p>
    
    <h3>1. Introduction</h3>
    <p>Welcome to Preface ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
    
    <h3>2. Information We Collect</h3>
    <p>We collect information that you provide directly to us when you:</p>
    <ul>
      <li>Create an account or user profile</li>
      <li>Use our prompt enhancement services</li>
      <li>Communicate with us via email or our support channels</li>
      <li>Participate in surveys or promotions</li>
    </ul>
    <p>This information may include:</p>
    <ul>
      <li>Contact information (such as name and email address)</li>
      <li>Profile information (such as profile picture)</li>
      <li>Content you generate, upload, or submit to our service</li>
      <li>Usage data and analytics information</li>
    </ul>
    
    <h3>3. How We Use Your Information</h3>
    <p>We use the information we collect to:</p>
    <ul>
      <li>Provide, maintain, and improve our services</li>
      <li>Process and complete transactions</li>
      <li>Send you technical notices, updates, and administrative messages</li>
      <li>Respond to your comments, questions, and requests</li>
      <li>Personalize your experience and deliver content relevant to your interests</li>
      <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
      <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
    </ul>
    
    <h3>4. Sharing of Information</h3>
    <p>We may share your personal information with:</p>
    <ul>
      <li>Service providers who perform services on our behalf</li>
      <li>Partners with whom we jointly offer products or services</li>
      <li>In response to a request for information if we believe disclosure is in accordance with applicable law</li>
      <li>If we believe your actions are inconsistent with our user agreements or policies</li>
    </ul>
    
    <h3>5. Data Security</h3>
    <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
    
    <h3>6. Your Rights</h3>
    <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
    <ul>
      <li>Access to your personal information</li>
      <li>Correction of inaccurate or incomplete information</li>
      <li>Deletion of your personal information</li>
      <li>Restriction or objection to processing</li>
      <li>Data portability</li>
    </ul>
    
    <h3>7. Children's Privacy</h3>
    <p>Our service is not directed to children under 16, and we do not knowingly collect personal information from children under 16. If we learn we have collected personal information from a child under 16, we will delete this information.</p>
    
    <h3>8. Changes to This Privacy Policy</h3>
    <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
    
    <h3>9. Contact Us</h3>
    <p>If you have any questions about this Privacy Policy, please contact us at: privacy@prefaceai.net</p>
  </div>
);

// User Agreement content
const userAgreementContent = (
  <div className={styles.policyContent}>
    <h3>Terms of Service</h3>
    <p>Last Updated: April 14, 2025</p>
    
    <h3>1. Acceptance of Terms</h3>
    <p>By accessing or using Preface's services, website, or applications (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.</p>
    
    <h3>2. Description of Service</h3>
    <p>Preface provides AI-enhanced prompt generation tools designed to help users create more effective prompts for AI communication. Our Service is subject to change and enhancement without prior notice.</p>
    
    <h3>3. Account Registration</h3>
    <p>To access certain features of the Service, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
    
    <h3>4. User Responsibilities</h3>
    <p>You are responsible for:</p>
    <ul>
      <li>Maintaining the confidentiality of your account credentials</li>
      <li>All activities that occur under your account</li>
      <li>Ensuring that your use of the Service complies with all applicable laws and regulations</li>
      <li>All content you submit, post, or display through the Service</li>
    </ul>
    
    <h3>5. Prohibited Uses</h3>
    <p>You agree not to:</p>
    <ul>
      <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
      <li>Violate or infringe other people's intellectual property, privacy, publicity, or other legal rights</li>
      <li>Engage in, promote, or encourage illegal or harmful activity</li>
      <li>Use the Service to distribute unsolicited promotional or commercial content</li>
      <li>Attempt to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service</li>
      <li>Collect or harvest any personally identifiable information from the Service</li>
      <li>Impersonate any person or entity or otherwise misrepresent your affiliation</li>
    </ul>
    
    <h3>6. Intellectual Property Rights</h3>
    <p>The Service and its original content, features, and functionality are owned by Preface and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
    
    <h3>7. User Content</h3>
    <p>You retain all rights to content you submit, post, or display through our Service. By providing content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content in connection with providing the Service.</p>
    
    <h3>8. Subscription and Payment</h3>
    <p>Some aspects of the Service may be available on a subscription basis. Payment terms will be specified during the subscription process. All purchases are final and non-refundable, except as required by applicable law.</p>
    
    <h3>9. Termination</h3>
    <p>We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease.</p>
    
    <h3>10. Disclaimer of Warranties</h3>
    <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
    
    <h3>11. Limitation of Liability</h3>
    <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PREFACE, ITS AFFILIATES, OR THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.</p>
    
    <h3>12. Governing Law</h3>
    <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Preface is established, without regard to its conflict of law provisions.</p>
    
    <h3>13. Changes to Terms</h3>
    <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
    
    <h3>14. Contact Us</h3>
    <p>If you have any questions about these Terms, please contact us at: legal@prefaceai.net</p>
  </div>
);