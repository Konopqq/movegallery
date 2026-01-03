"use client";
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSession } from 'next-auth/react';
import { 
  TrashIcon, 
  CheckIcon, 
  ArrowDownTrayIcon, 
  PencilSquareIcon, 
  XMarkIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
// Імпортуємо безпечні серверні дії
import { deleteAssetAction, updateStatusAction, updateAssetInfoAction } from '../actions';
// Імпортуємо модалку керування адмінами
import AdminManagerModal from '@/components/AdminManagerModal';

const CATEGORIES = ['logo', 'moveus', 'fon', 'text', 'art'];
type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // State: Редагування
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  
  // State: Видалення (Модалка)
  const [itemToDelete, setItemToDelete] = useState<{id: string, path: string} | null>(null);
  
  // State: Керування адмінами (Модалка)
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState(false);

  // State: Лоадер на конкретній картці
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // 1. Завантаження списку (Читання дозволено всім, тому клієнтський запит ОК)
  const fetchAssets = async () => {
    const { data } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAssets(data);
  };

  useEffect(() => {
    if (status !== "loading") fetchAssets();
  }, [session, status]);

  const filteredAssets = assets.filter(asset => {
    if (filter === 'all') return true;
    return asset.status === filter;
  });

  // --- ACTIONS (Викликають Server Actions) ---

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateStatusAction(id, newStatus);
      // Оновлюємо локально для швидкості
      setAssets(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const initiateDelete = (id: string, filePath: string) => {
    setItemToDelete({ id, path: filePath });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(itemToDelete.id);
    
    try {
      await deleteAssetAction(itemToDelete.id, itemToDelete.path);
      setAssets(prev => prev.filter(a => a.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (id: string, oldFilePath: string) => {
    setActionLoading(id);
    try {
        let newFilePath = undefined;
        
        // Якщо вибрали новий файл - вантажимо його
        if (newFile) {
            const fileExt = newFile.name.split('.').pop();
            const fileName = `${Date.now()}_edited.${fileExt}`;
            const { error } = await supabase.storage.from('uploads').upload(fileName, newFile);
            if (error) throw error;
            newFilePath = fileName;
        }

        await updateAssetInfoAction(id, editTitle, editCategory, newFilePath, oldFilePath);
        
        setEditingId(null);
        fetchAssets(); 
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setActionLoading(null);
    }
  };

  // --- Helper Functions ---
  const startEditing = (asset: any) => {
    setEditingId(asset.id);
    setEditTitle(asset.title);
    setEditCategory(asset.category || 'art');
    setNewFile(null);
  };

  const downloadImage = async (path: string, title: string) => {
    try {
      const { data, error } = await supabase.storage.from('uploads').download(path);
      if (error) throw error;
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.${path.split('.').pop()}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e: any) {
      alert('Download failed');
    }
  };

  if (status === "loading") return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
         
         <div className="flex flex-col gap-1">
             <div className="text-gray-500 text-sm font-mono">
                Total: <strong className="text-white">{assets.length}</strong> | 
                Shown: <strong className="text-white">{filteredAssets.length}</strong>
             </div>
             
             {/* КНОПКА MANAGE ADMINS */}
             <button 
                onClick={() => setIsAdminManagerOpen(true)}
                className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition mt-1 w-fit"
             >
                <UserGroupIcon className="h-4 w-4" />
                Manage Admins
             </button>
         </div>

         {/* FILTER PILLS */}
         <div className="flex bg-[#111] p-1 rounded-xl border border-white/10 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                        filter === f ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {f}
                </button>
            ))}
         </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className={`bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-xl relative group transition-opacity duration-200 ${actionLoading === asset.id ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* IMAGE AREA */}
            <div className="relative h-64 w-full bg-[#020202] flex items-center justify-center overflow-hidden">
                <img 
                    src={editingId === asset.id && newFile ? URL.createObjectURL(newFile) : `https://bfcuoffgxfdkzjloousm.supabase.co/storage/v1/object/public/uploads/${asset.file_path}`}
                    alt={asset.title}
                    className="w-full h-full object-contain p-4"
                />
                
                {/* Status Badge */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border z-10 ${
                    asset.status === 'approved' ? 'bg-green-900/40 text-green-400 border-green-500/30' : 
                    asset.status === 'rejected' ? 'bg-red-900/40 text-red-400 border-red-500/30' :
                    'bg-yellow-900/40 text-yellow-400 border-yellow-500/30'
                }`}>
                    {asset.status}
                </div>

                <button onClick={() => downloadImage(asset.file_path, asset.title)} className="absolute top-4 right-4 bg-black/50 hover:bg-white p-2 rounded-full cursor-pointer z-20 group-hover:opacity-100 transition-opacity">
                    <ArrowDownTrayIcon className="h-5 w-5 text-white hover:text-black" />
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="p-6 flex-1 flex flex-col gap-4 relative bg-[#0A0A0A]">
                {editingId === asset.id ? (
                    // --- EDIT FORM ---
                    <div className="flex flex-col gap-3">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-[#151515] border border-gray-700 text-white text-sm rounded-lg p-2 outline-none focus:border-blue-500"/>
                        <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-[#151515] border border-gray-700 text-white text-sm rounded-lg p-2 outline-none focus:border-blue-500">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <input type="file" ref={fileInputRef} onChange={(e) => setNewFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-400"/>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => handleSaveEdit(asset.id, asset.file_path)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg">Save</button>
                            <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-2 rounded-lg">Cancel</button>
                        </div>
                    </div>
                ) : (
                    // --- NORMAL VIEW ---
                    <>
                        <div className="flex justify-between items-start">
                            <div className="overflow-hidden">
                                <h3 className="text-lg font-bold text-white leading-snug truncate">{asset.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">
                                        By: {asset.user_name || asset.discord_user_id}
                                    </span>
                                    <span className="text-[10px] uppercase bg-white/5 px-1.5 rounded text-gray-400 border border-white/5">{asset.category}</span>
                                </div>
                            </div>
                            <button onClick={() => startEditing(asset)} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded transition"><PencilSquareIcon className="h-5 w-5" /></button>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-white/5">
                            <button 
                                onClick={() => handleUpdateStatus(asset.id, 'approved')} 
                                className={`flex justify-center bg-[#151515] border border-white/10 rounded-lg py-3 hover:bg-green-600 hover:text-white hover:border-green-500 transition shadow-md ${asset.status === 'approved' ? 'text-green-500 border-green-500/30' : 'text-gray-400'}`}
                                title="Approve"
                            >
                                <CheckIcon className="h-5 w-5" />
                            </button>
                            
                            <button 
                                onClick={() => handleUpdateStatus(asset.id, 'rejected')} 
                                className={`flex justify-center bg-[#151515] border border-white/10 rounded-lg py-3 hover:bg-yellow-600 hover:text-white hover:border-yellow-500 transition shadow-md ${asset.status === 'rejected' ? 'text-yellow-500 border-yellow-500/30' : 'text-gray-400'}`}
                                title="Reject"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                            
                            <button 
                                onClick={() => initiateDelete(asset.id, asset.file_path)} 
                                className="flex justify-center bg-[#151515] hover:bg-red-600 text-gray-400 hover:text-white border border-white/10 hover:border-red-500 py-3 rounded-lg transition shadow-md"
                                title="Delete"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            {/* Loading Spinner Overlay */}
            {actionLoading === asset.id && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 rounded-2xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-gray-600">
            <FunnelIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No assets found for filter "{filter}".</p>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Delete Asset?</h3>
                        <p className="text-sm text-gray-400">This action cannot be undone.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        <button 
                            onClick={() => setItemToDelete(null)} 
                            className="py-2.5 rounded-xl text-sm font-bold bg-[#222] text-white hover:bg-[#333] transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmDelete} 
                            className="py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20 transition"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- ADMIN MANAGER MODAL --- */}
      <AdminManagerModal 
        isOpen={isAdminManagerOpen} 
        onClose={() => setIsAdminManagerOpen(false)} 
      />

    </div>
  );
}