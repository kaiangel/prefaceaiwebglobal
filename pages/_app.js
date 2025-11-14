import '../styles/globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <GoogleOAuthProvider clientId="771291701862-klltk7atc0o47fonsp9degm2s21oilok.apps.googleusercontent.com">
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;