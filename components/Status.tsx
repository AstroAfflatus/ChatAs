import React, { useState, useEffect, useContext } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { db, AppContext } from '../App';
import { Header } from './Layout';
import { Plus, Camera, Trash2, X } from 'lucide-react';
import { StatusItem } from '../types';
import { uploadToImgBB } from '../services/firebase';

export const StatusView: React.FC = () => {
    const { user } = useContext(AppContext);
    const [myStatus, setMyStatus] = useState<StatusItem[]>([]);
    const [othersStatus, setOthersStatus] = useState<StatusItem[]>([]);
    const [viewingStatus, setViewingStatus] = useState<StatusItem[] | null>(null);
    const [showComposer, setShowComposer] = useState(false);

    useEffect(() => {
        if (!user) return;
        const statusRef = ref(db, 'statuses');
        onValue(statusRef, (snap) => {
            const data = snap.val();
            const my: StatusItem[] = [];
            const others: StatusItem[] = [];
            const now = Date.now();

            if (data) {
                Object.values(data).forEach((item: any) => {
                    if (item.expiresAt > now) {
                        if (item.userId === user.uid) my.push(item);
                        else others.push(item);
                    }
                });
            }
            setMyStatus(my);
            setOthersStatus(others);
        });
    }, [user]);

    return (
        <div className="h-full flex flex-col bg-dark-bg">
            <Header title="Status" actions={<button onClick={() => setShowComposer(true)}><Camera className="text-primary" /></button>} />
            
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                {/* My Status */}
                <div className="flex items-center" onClick={() => myStatus.length > 0 ? setViewingStatus(myStatus) : setShowComposer(true)}>
                    <div className={`relative w-14 h-14 rounded-full border-2 ${myStatus.length > 0 ? 'border-primary' : 'border-gray-600'} p-0.5`}>
                         <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                             {myStatus.length > 0 && myStatus[0].type === 'image' ? (
                                <img src={myStatus[0].content} className="w-full h-full object-cover"/>
                             ) : (
                                <span className="text-xs text-white">
                                    {myStatus.length > 0 ? 'Text' : <Plus />}
                                </span>
                             )}
                         </div>
                         {myStatus.length === 0 && (
                            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border border-black">
                                <Plus size={10} color="white"/>
                            </div>
                         )}
                    </div>
                    <div className="ml-4">
                        <h3 className="font-bold text-text-primary">My Status</h3>
                        <p className="text-sm text-text-secondary">Tap to add status update</p>
                    </div>
                </div>

                <div className="text-sm font-bold text-text-secondary">Recent Updates</div>
                
                {othersStatus.map(status => (
                    <div key={status.id} className="flex items-center" onClick={() => setViewingStatus([status])}>
                         <div className="w-14 h-14 rounded-full border-2 border-primary p-0.5">
                            <div className="w-full h-full rounded-full bg-gray-700 overflow-hidden">
                                {status.type === 'image' ? (
                                    <img src={status.content} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-purple-500 text-[8px]">TEXT</div>
                                )}
                            </div>
                         </div>
                         <div className="ml-4">
                            <h3 className="font-bold text-text-primary">User {status.userId.substr(0,4)}</h3>
                            <p className="text-sm text-text-secondary">Today, {new Date(status.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                         </div>
                    </div>
                ))}
            </div>

            {showComposer && <StatusComposer onClose={() => setShowComposer(false)} />}
            {viewingStatus && <StatusViewer statuses={viewingStatus} onClose={() => setViewingStatus(null)} />}
        </div>
    );
};

const StatusComposer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useContext(AppContext);
    const [text, setText] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [bgColor, setBgColor] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');

    const handlePost = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let content = text;
            let type: 'text' | 'image' = 'text';

            if (image) {
                content = await uploadToImgBB(image);
                type = 'image';
            }

            const newStatus: StatusItem = {
                id: `status_${Date.now()}`,
                userId: user.uid,
                type,
                content,
                background: type === 'text' ? bgColor : undefined,
                timestamp: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            };

            const statusRef = push(ref(db, 'statuses'));
            await set(statusRef, newStatus);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error posting status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col animate-slide-in">
            <div className="flex-1 flex items-center justify-center p-8 relative" style={{ background: image ? 'black' : bgColor }}>
                <button onClick={onClose} className="absolute top-4 left-4 text-white"><X size={32}/></button>
                
                {image ? (
                    <img src={URL.createObjectURL(image)} className="max-h-full max-w-full" />
                ) : (
                    <textarea 
                        className="w-full bg-transparent text-white text-3xl font-bold text-center focus:outline-none resize-none placeholder-white/50"
                        placeholder="Type a status"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        maxLength={700}
                    />
                )}
            </div>
            
            <div className="bg-black p-4 flex items-center justify-between">
                <div className="flex space-x-4">
                    <label className="p-2 bg-gray-800 rounded-full cursor-pointer">
                        <Camera className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setImage(e.target.files[0])} />
                    </label>
                    {/* Simplified Bg Picker */}
                    {!image && (
                         <button onClick={() => setBgColor('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')} className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-red-500" />
                    )}
                </div>
                <button 
                    onClick={handlePost} 
                    disabled={(!text && !image) || loading}
                    className="bg-primary px-6 py-2 rounded-full text-white font-bold disabled:opacity-50"
                >
                    {loading ? 'Posting...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

const StatusViewer: React.FC<{ statuses: StatusItem[], onClose: () => void }> = ({ statuses, onClose }) => {
    const [index, setIndex] = useState(0);
    const current = statuses[index];

    useEffect(() => {
        const timer = setTimeout(() => {
            if (index < statuses.length - 1) setIndex(index + 1);
            else onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [index, statuses]);

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
            {/* Progress Bar */}
            <div className="flex space-x-1 p-2 pt-4 absolute top-0 w-full z-10">
                {statuses.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
                        <div className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${i === index ? 'w-full' : i < index ? 'w-full duration-0' : 'w-0'}`} />
                    </div>
                ))}
            </div>
            
            <div className="flex-1 flex items-center justify-center relative" style={{ background: current.type === 'text' ? current.background : 'black' }}>
                 {current.type === 'image' ? (
                     <img src={current.content} className="max-w-full max-h-full" />
                 ) : (
                     <p className="text-white text-3xl font-bold text-center px-8">{current.content}</p>
                 )}
            </div>
            <button onClick={onClose} className="absolute top-8 right-4 text-white z-20"><X size={28}/></button>
        </div>
    );
};