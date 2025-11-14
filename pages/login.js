import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Login.module.css';

export default function Login() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 如果用户已登录，跳转到首页
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // 处理 Google 登录成功响应
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // Use the jwtDecode function to decode the token
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google login successful, user info:", decoded);
      
      // Extract user information
      const { email, sub, name, picture } = decoded;
      
      // Call our proxy API route instead of the external API directly
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thirdPartyId: sub,
          email: email
        }),
      });
      
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.data && data.data.openid) {
        // Login successful, save user info and token
        login({
          openid: data.data.openid,
          email: email,
          name: name,
          picture: picture
        });
        
        router.push('/');
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide more specific error messages
      if (error.message.includes('fetch')) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else if (error.message.includes('decode')) {
        setErrorMessage('Error processing login response. Please try again.');
      } else {
        setErrorMessage(`Login error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    setErrorMessage('Google login failed. Please try again.');
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <Head>
        <title>Login - Preface</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <div className={styles.loginContent}>
        <div className={styles.brandHeader}>
          <h1 className={styles.brandTitle}>Preface</h1>
          <p className={styles.brandSubtitle}>When you want AI to think like you...</p>
        </div>
        
        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}
        
        <div className={styles.loginOptions}>
          {/* Google登录区域 - 使用原始的GoogleLogin组件 */}
          <div className={styles.googleLoginContainer}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              width="280px"
              text="signin_with"
              shape="rectangular"
              locale="en"
            />
          </div>
          
          <div className={styles.dividerContainer}>
            <span className={styles.dividerText}>or</span>
          </div>
          
          {/* 邮箱登录 - 即将推出 */}
          <div className={styles.loginOptionDisabled}>
            <div className={styles.iconContainer}>
              <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div className={styles.loginButtonContainer}>
              <button className={styles.disabledLoginButton} disabled>
                Sign in with Email
                <span className={styles.comingSoonBadge}>Coming soon</span>
              </button>
            </div>
          </div>
          
          {/* Apple登录 - 即将推出 */}
          <div className={styles.loginOptionDisabled}>
            <div className={styles.iconContainer}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05,12.04c-0.03-2.71,2.21-4.01,2.31-4.07c-1.26-1.84-3.22-2.09-3.92-2.12c-1.67-0.17-3.25,0.98-4.1,0.98c-0.84,0-2.15-0.96-3.54-0.93c-1.82,0.03-3.5,1.06-4.43,2.68c-1.89,3.28-0.48,8.13,1.36,10.79c0.9,1.3,1.97,2.76,3.37,2.71c1.35-0.05,1.86-0.87,3.49-0.87c1.63,0,2.1,0.87,3.53,0.84c1.45-0.02,2.38-1.33,3.27-2.63c1.03-1.51,1.45-2.97,1.48-3.04C19.85,16.32,17.08,15.23,17.05,12.04z M14.61,4.64c0.74-0.9,1.25-2.15,1.11-3.39c-1.07,0.04-2.37,0.71-3.14,1.61c-0.69,0.8-1.29,2.07-1.13,3.29C12.61,6.25,13.87,5.54,14.61,4.64z"/>
              </svg>
            </div>
            <div className={styles.loginButtonContainer}>
              <button className={styles.disabledLoginButton} disabled>
                Sign in with Apple
                <span className={styles.comingSoonBadge}>Coming soon</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.termsText}>
          By signing in, you agree to our <Link href="/terms" className={styles.termsLink}>Terms of Service</Link> and <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>
        </div>
        
        <div className={styles.homeLink}>
          <Link href="/" className={styles.homeLinkText}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}