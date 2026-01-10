"use client";
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSession } from 'next-auth/react';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchNotifications = async () => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    
    const { data } = await supabase
      .from('assets')
      .select('id, title, status, created_at')
      .eq('discord_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      
      const hasPending = data.some(n => n.status === 'pending');
      
      if (data.length > 0 && !isOpen) setHasUnread(true);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); 

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [session]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasUnread(false);
  };

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleOpen}
        className={`relative p-2 rounded-full transition ${isOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
      >
        <BellIcon className="h-6 w-6" />
        {hasUnread && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#050505] animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b border-white/5 bg-[#161616]">
            <h3 className="text-sm font-bold text-white">History</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No notifications yet</div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="p-3 hover:bg-white/5 transition flex items-start gap-3 border-b border-white/5 last:border-0">
                  <div className="mt-0.5 shrink-0">
                    {item.status === 'approved' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {item.status === 'rejected' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                    {item.status === 'pending' && <ClockIcon className="h-5 w-5 text-yellow-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className={`text-xs mt-0.5 capitalize ${
                        item.status === 'approved' ? 'text-green-400' : 
                        item.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {item.status}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}