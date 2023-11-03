import {getFirestore, setDoc, doc} from 'firebase/firestore';
import Head from 'next/head';
import {useEffect} from 'react';
import {useUser} from '../context/userContext';
import styles from './index.module.sass';

export default function Home() {
  // Our custom hook to get context values
  const {loadingUser, user} = useUser();

  useEffect(() => {
    if (!loadingUser) {
      // You know that the user is loaded: either logged in or out!
      console.log(user);
    }
    // You also have your firebase app initialized
  }, [loadingUser, user]);

  return (
    <div>
      <Head>
        <title>AdClip</title>
        <link rel="icon" href="/adclip.ico" />
      </Head>

      <main>
        <h1>AdClip</h1>
      </main>
    </div>
  );
}
