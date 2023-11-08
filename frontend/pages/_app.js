import {useEffect} from 'react';
import UserProvider from '../context/userContext';
import {useUser} from '../context/userContext';
import '../styles/global.sass';
import {usePathname, useRouter} from 'next/navigation';
import Store from '../store/AdClipStore';
import Header from '../components/Header';
import styles from './_app.module.sass';

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

  return (
    <>
      <Header />
      <main className={styles.main}>{children}</main>
    </>
  );
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
