import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.navLeft}>
          <Link href="/" className={styles.logo}>
            Preface
          </Link>
        </div>
        
        <div className={styles.navRight}>
          {user ? (
            <>
              <div className={styles.navLinksDesktop}>
                <Link 
                  href="/"
                  className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`}
                >
                  Home
                </Link>
                <Link 
                  href="/history"
                  className={`${styles.navLink} ${router.pathname === '/history' ? styles.active : ''}`}
                >
                  History
                </Link>
                <Link 
                  href="/favorites"
                  className={`${styles.navLink} ${router.pathname === '/favorites' ? styles.active : ''}`}
                >
                  Favorites
                </Link>
                <Link 
                  href="/profile"
                  className={`${styles.navLink} ${router.pathname === '/profile' ? styles.active : ''}`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className={styles.signOutButton}
                >
                  Sign Out
                </button>
              </div>
              
              <div className={styles.mobileActions}>
                <Link href="/profile" className={styles.profileLink}>
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt="Profile" 
                      className={styles.profileImage}
                    />
                  ) : (
                    <div className={styles.profileInitial}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </Link>
                
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={styles.menuButton}
                  aria-label="Menu"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {menuOpen ? (
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      <path
                        d="M4 6H20M4 12H20M4 18H20"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className={styles.signInButton}>
              Sign In
            </Link>
          )}
        </div>
      </div>
      
      {/* 移动端菜单 */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link 
            href="/"
            className={`${styles.mobileNavLink} ${router.pathname === '/' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/history"
            className={`${styles.mobileNavLink} ${router.pathname === '/history' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            History
          </Link>
          <Link 
            href="/favorites"
            className={`${styles.mobileNavLink} ${router.pathname === '/favorites' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Favorites
          </Link>
          <Link 
            href="/profile"
            className={`${styles.mobileNavLink} ${router.pathname === '/profile' ? styles.active : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Profile
          </Link>
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className={styles.mobileSignOutButton}
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}