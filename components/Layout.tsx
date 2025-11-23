import React from 'react';
import { MessageCircle, CircleDashed, Phone } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'chats' | 'status' | 'calls';
  onTabChange: (tab: 'chats' | 'status' | 'calls') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const getBtnClass = (tab: string) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
      activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <div className="h-16 bg-dark-container border-t border-dark-surface flex justify-between items-center px-2 z-20">
      <button className={getBtnClass('chats')} onClick={() => onTabChange('chats')}>
        <MessageCircle size={24} fill={activeTab === 'chats' ? 'currentColor' : 'none'} />
        <span className="text-xs font-medium">Chats</span>
      </button>
      <button className={getBtnClass('status')} onClick={() => onTabChange('status')}>
        <CircleDashed size={24} strokeWidth={activeTab === 'status' ? 2.5 : 2} />
        <span className="text-xs font-medium">Status</span>
      </button>
      <button className={getBtnClass('calls')} onClick={() => onTabChange('calls')}>
        <Phone size={24} fill={activeTab === 'calls' ? 'currentColor' : 'none'} />
        <span className="text-xs font-medium">Calls</span>
      </button>
    </div>
  );
};

export const Header: React.FC<{ title: string; actions?: React.ReactNode }> = ({ title, actions }) => (
  <header className="h-16 bg-dark-container border-b border-dark-surface flex items-center justify-between px-4 z-20 shadow-sm">
    <h1 className="text-xl font-bold text-text-primary tracking-wide">{title}</h1>
    <div className="flex items-center space-x-3">
      {actions}
    </div>
  </header>
);