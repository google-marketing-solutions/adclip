/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {useState, useEffect, createContext, useContext} from 'react';
import {createFirebaseApp} from '../firebase/clientApp';
import {getAuth, onAuthStateChanged} from 'firebase/auth';

export const UserContext = createContext();

export default function UserContextComp({children}) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // Helpful, to update the UI accordingly.

  useEffect(() => {
    // Listen authenticated user
    const app = createFirebaseApp();
    const auth = getAuth(app);
    const unsubscriber = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // User is signed in.
          const {uid, displayName, email, photoURL} = user;
          // You could also look for the user doc in your Firestore (if you have one):
          // const userDoc = await firebase.firestore().doc(`users/${uid}`).get()
          setUser({uid, displayName, email, photoURL});
        } else setUser(null);
      } catch (error) {
        // Most probably a connection error. Handle appropriately.
      } finally {
        setLoadingUser(false);
      }
    });

    // Unsubscribe auth listener on unmount
    return () => unsubscriber();
  }, []);

  return (
    <UserContext.Provider value={{user, setUser, loadingUser}}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook that shorthands the context!
export const useUser = () => useContext(UserContext);
