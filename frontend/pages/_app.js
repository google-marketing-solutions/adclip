import UserProvider from '../context/userContext';
import './global.sass';

// Custom App to wrap it with context provider
export default function App({Component, pageProps}) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  );
}
