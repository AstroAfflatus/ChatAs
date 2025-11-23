import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db, auth } from '../App';
import { uploadToImgBB } from '../services/firebase';
import { Camera, Loader2, User, Save } from 'lucide-react';
import { UserData } from '../types';

interface ProfileSetupProps {
  user: FirebaseUser;
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('Hey there! I am using ChatAs');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    try {
      let photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00A878&color=fff`;
      
      if (profilePic) {
        photoUrl = await uploadToImgBB(profilePic);
      }

      // Generate unique userId like cs-XXXX
      const uniqueId = 'cs-' + Math.random().toString(36).substr(2, 4);
      const phone = localStorage.getItem('signup_phone') || '';
      localStorage.removeItem('signup_phone');

      const userData: UserData = {
        userId: uniqueId,
        displayName: displayName.trim(),
        email: user.email!,
        phoneNumber: phone,
        bio: bio.trim(),
        profilePicture: photoUrl,
        createdAt: Date.now()
      };

      await set(ref(db, `users/${user.uid}`), userData);
      onComplete();
    } catch (error) {
      console.error("Profile save error:", error);
      alert('Failed to save profile. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-md bg-dark-container p-8 rounded-2xl border border-dark-surface shadow-2xl">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Setup Profile</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-dark-elevated border-2 border-primary">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <User size={40} />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                <Camera size={20} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary uppercase tracking-wider mb-1">Display Name</label>
              <input
                type="text"
                required
                maxLength={20}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full p-3 border border-dark-surface rounded-lg bg-dark-surface text-text-primary focus:ring-primary focus:border-primary"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div>
              <label className="block text-xs text-text-secondary uppercase tracking-wider mb-1">Bio</label>
              <input
                type="text"
                maxLength={100}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block w-full p-3 border border-dark-surface rounded-lg bg-dark-surface text-text-primary focus:ring-primary focus:border-primary"
                placeholder="About you"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Settings Modal Component
export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; userData: UserData }> = ({ isOpen, onClose, userData }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-dark-bg animate-fade-in flex flex-col">
        <div className="h-16 bg-dark-container border-b border-dark-surface flex items-center px-4">
            <button onClick={onClose} className="text-text-primary mr-4">←</button>
            <h2 className="text-lg font-bold">Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-dark-surface rounded-xl">
                <img src={userData.profilePicture} className="w-16 h-16 rounded-full object-cover" />
                <div>
                    <h3 className="text-xl font-bold text-text-primary">{userData.displayName}</h3>
                    <p className="text-sm text-text-secondary">{userData.bio}</p>
                    <p className="text-xs text-primary mt-1">ID: {userData.userId}</p>
                </div>
            </div>
            
            <div className="space-y-2">
                <h4 className="text-primary text-sm font-bold uppercase">Account</h4>
                <div className="bg-dark-surface rounded-xl overflow-hidden">
                   <div className="p-4 border-b border-dark-bg text-text-primary">Privacy</div>
                   <div className="p-4 border-b border-dark-bg text-text-primary">Security</div>
                   <button className="w-full p-4 text-left text-red-500 hover:bg-dark-bg/50" onClick={() => auth.signOut()}>Log Out</button>
                </div>
            </div>
        </div>
    </div>
  );
};