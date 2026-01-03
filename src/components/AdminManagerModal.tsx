"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { XMarkIcon, UserPlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { addNewAdminAction, removeAdminAction } from '@/app/actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminManagerModal({ isOpen, onClose }: Props) {
  const [admins, setAdmins] = useState<any[]>([]);
  const [newId, setNewId] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  
  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    if (data) setAdmins(data);
  };

  useEffect(() => {
    if (isOpen) fetchAdmins();
  }, [isOpen]);

  const handleAdd = async () => {
    if (!newId) return;
    setLoading(true);
    try {
      await addNewAdminAction(newId);
      setNewId('');
      fetchAdmins(); 
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm(`Remove admin rights from ${id}?`)) return;
    try {
      await removeAdminAction(id);
      fetchAdmins();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
        
        <div className="flex items-center gap-2 mb-6 text-white">
            <UserGroupIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold">Manage Admins</h2>
        </div>

        
        <div className="flex gap-2 mb-6">
            <input 
                type="text" 
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="Paste Discord ID here..."
                className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />
            <button 
                onClick={handleAdd} 
                disabled={loading || !newId}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg disabled:opacity-50"
            >
                {loading ? '...' : <UserPlusIcon className="h-5 w-5" />}
            </button>
        </div>

       
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {admins.map((admin) => (
                <div key={admin.id} className="flex justify-between items-center p-3 bg-[#161616] rounded-lg border border-white/5">
                    <span className="text-sm font-mono text-gray-300">{admin.discord_id}</span>
                    <button 
                        onClick={() => handleRemove(admin.discord_id)}
                        className="text-gray-500 hover:text-red-500 transition p-1"
                        title="Remove Admin"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}