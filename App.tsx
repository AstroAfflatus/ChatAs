import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getDatabase, ref, onValue, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { AuthView } from './components/Auth';
import { ChatsView } from './components/Chats';
import { StatusView } from './components/Status';
import { CallsView } from './components/Calls';
import { ProfileSetup } from './components/Profile';
import { ActiveCall } from './components/ActiveCall';
import { BottomNav } from './components/Layout';
import { firebaseConfig } from './services/firebase';
import { UserData } from './types';
import { MessageCircle, CircleDashed, Phone } from 'lucide-react';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Contexts
interface AppContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  activeTab: 'chats' | 'status' | 'calls';
  setActiveTab: (tab: 'chats' | 'status' | 'calls') => void;
  setUserData: (data: UserData) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls'>('chats');
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile data
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserData(data);
            setShowProfileSetup(false);
            
            // Online Status System
            const connectedRef = ref(db, '.info/connected');
            const userStatusRef = ref(db, `status/${currentUser.uid}`);
            
            onValue(connectedRef, (snap) => {
              if (snap.val() === true) {
                set(userStatusRef, {
                  state: 'online',
                  lastChanged: serverTimestamp(),
                });
                onDisconnect(userStatusRef).set({
                  state: 'offline',
                  lastChanged: serverTimestamp(),
                });
              }
            });

          } else {
            // User exists in Auth but no DB record -> Needs setup
            setShowProfileSetup(true);
          }
          setLoading(false);
        }, (error) => {
           console.error("DB Error:", error);
           setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for incoming calls globally
  useEffect(() => {
    if (!user) return;
    const callsRef = ref(db, 'calls');
    const unsubCalls = onValue(callsRef, (snapshot) => {
        snapshot.forEach((child) => {
            const call = child.val();
            if (call.calleeId === user.uid && call.status === 'ringing') {
                setIncomingCall({ id: child.key, ...call });
            }
        });
    });
    return () => unsubCalls();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (showProfileSetup) {
    return <ProfileSetup user={user} onComplete={() => setShowProfileSetup(false)} />;
  }

  return (
    <AppContext.Provider value={{ user, userData, loading, activeTab, setActiveTab, setUserData }}>
      <div className="flex justify-center min-h-screen bg-black lg:items-center">
        {/* Mobile Container */}
        <div className="relative w-full max-w-[450px] h-[100dvh] lg:h-[900px] bg-dark-bg lg:rounded-[24px] lg:shadow-2xl overflow-hidden flex flex-col border border-dark-surface/30">
          
          {/* Incoming Call Modal Overlay */}
          {incomingCall && (
             <ActiveCall 
                callId={incomingCall.id} 
                callData={incomingCall} 
                isIncoming={true}
                onClose={() => setIncomingCall(null)} 
             />
          )}

          {/* Main Content Areas */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'chats' && <ChatsView />}
            {activeTab === 'status' && <StatusView />}
            {activeTab === 'calls' && <CallsView />}
          </div>

          {/* Bottom Navigation */}
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;