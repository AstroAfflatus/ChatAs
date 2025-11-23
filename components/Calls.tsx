import React, { useEffect, useState, useContext } from 'react';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { db, AppContext } from '../App';
import { Header } from './Layout';
import { Phone, Video, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { CallLog } from '../types';

export const CallsView: React.FC = () => {
    const { user } = useContext(AppContext);
    const [calls, setCalls] = useState<CallLog[]>([]);

    useEffect(() => {
        // Since we don't have a dedicated callLog node in our simplified ActiveCall, 
        // we will query the 'calls' node where userId matches. 
        // In a real app, you'd duplicate data to `callLogs/{uid}` for efficiency.
        const callsRef = ref(db, 'calls');
        onValue(callsRef, (snap) => {
            const data = snap.val();
            if(data) {
                const myCalls: CallLog[] = [];
                Object.values(data).forEach((c: any) => {
                    if (c.callerId === user?.uid || c.calleeId === user?.uid) {
                        myCalls.push({
                            id: c.id,
                            callerId: c.callerId,
                            calleeId: c.calleeId,
                            type: c.type || 'voice',
                            status: c.status,
                            startTime: c.startTime,
                        });
                    }
                });
                setCalls(myCalls.sort((a,b) => b.startTime - a.startTime));
            }
        });
    }, [user]);

    return (
        <div className="h-full flex flex-col bg-dark-bg">
            <Header title="Calls" />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {calls.map((call, idx) => {
                    const isOutgoing = call.callerId === user?.uid;
                    const isMissed = call.status === 'missed' || call.status === 'rejected';
                    
                    return (
                        <div key={idx} className="flex items-center justify-between p-2">
                             <div className="flex items-center">
                                 <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                                     <Phone size={20} className="text-white"/>
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-text-primary ${isMissed ? 'text-red-500' : ''}">
                                         {isOutgoing ? 'Outgoing' : 'Incoming'}
                                     </h3>
                                     <div className="flex items-center text-sm text-text-secondary">
                                         {isOutgoing ? <ArrowUpRight size={14} className="mr-1 text-green-500"/> : <ArrowDownLeft size={14} className="mr-1 text-red-500"/>}
                                         {new Date(call.startTime).toLocaleDateString()}
                                     </div>
                                 </div>
                             </div>
                             <div className="text-primary">
                                 {call.type === 'video' ? <Video /> : <Phone />}
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};