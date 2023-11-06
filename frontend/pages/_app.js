import {useEffect} from 'react';
import UserProvider from '../context/userContext';
import {useUser} from '../context/userContext';
import './global.sass';
import {usePathname, useRouter} from 'next/navigation';
import Store from '../store/AdClipStore';

function Layout({children}) {
  const router = useRouter();
  const pathname = usePathname();
  const {loadingUser, user} = useUser();

  useEffect(() => {
    if (loadingUser) return;

    // if logged in, redirect to home screen
    if (user && pathname === '/sign-in') {
      router.push('/');
    }
    if (!user && pathname !== '/sign-in') {
      router.push('/signIn');
    }
  }, [pathname, user, router, loadingUser]);

  return children;
}

// Custom App to wrap it with context provider
export default function App({Component, pageProps}) {
  return (
    <UserProvider>
      <Store.Container>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Store.Container>
    </UserProvider>
  );
}
