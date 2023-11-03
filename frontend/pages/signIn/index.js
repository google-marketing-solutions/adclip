// Import FirebaseAuth and firebase.
import React from 'react';
import {useState} from 'react';
import firebase from '@firebase/app-compat';
import 'firebase/compat/auth';
import {useRouter} from 'next/navigation';
import {createFirebaseApp} from '../../firebase/clientApp';
import dynamic from 'next/dynamic';

const StyledFirebaseAuth = dynamic(() => import('./StyledFirebaseAuth'), {
  ssr: false,
});

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

firebase.initializeApp(config);

export default function SignIn() {
  const router = useRouter();
  const uiConfig = {
    // Popup signin flow rather than redirect flow.
    signInFlow: 'popup',
    signInSuccessUrl: '/',
    callbacks: {
      signInSuccessWithAuthResult: () => {
        router.push('/');
        console.log('sign in successful');
      },
    },
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  };

  return (
    <div style={{textAlign: 'center'}}>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  );
}
