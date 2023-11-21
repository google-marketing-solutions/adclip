import {useEffect} from 'react';
import Head from 'next/head';
import UserProvider from '../context/userContext';
import {useUser} from '../context/userContext';
import '../styles/global.sass';
import {useRouter} from 'next/router';
import {usePathname} from 'next/navigation';
import Store from '../store/AdClipStore';
import Header from '../components/Header';
import NavigationBar from '../components/NavigationBar';
import styles from './_app.module.sass';

function Layout({children}) {
  const store = Store.useStore();
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

  useEffect(() => {
    if (!router.isReady) return;
    const videoFullPath = router.query.videoFullPath;
    store.set('inputVideoFullPath')(videoFullPath);
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>AdClip</title>
        <link rel="icon" href="/adclip.ico" />
      </Head>

      <Header />
      <main className={styles.main}>
        <NavigationBar />
        {children}
      </main>
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
