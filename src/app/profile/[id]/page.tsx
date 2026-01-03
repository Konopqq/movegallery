"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  ArrowDownTrayIcon,
  PhotoIcon 
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { id } = useParams(); // Отримуємо ID з URL
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAssets = async () => {
      setLoading(true);
      // Завантажуємо всі роботи цього користувача (незалежно від статусу)
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('discord_user_id', id)
        .order('created_at', { ascending: false });
      
      if (data) setAssets(data);
      setLoading(false);
    };

    if (id) fetchUserAssets();
  }, [id]);

  // Беремо інфо про юзера з останньої завантаженої роботи (бо окремої таблиці юзерів у нас немає)
  const userInfo = assets[0] || { user_name: 'User', user_avatar: null };

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
    } catch (e) {
      alert('Error downloading');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* --- 1. ШАПКА ПРОФІЛЮ (Мінімалізм) --- */}
        {!loading && assets.length > 0 && (
          <div className="flex items-center gap-6 mb-12 border-b border-white/10 pb-8">
            {/* Аватарка (Велика) */}
            <div className="h-24 w-24 rounded-full border-2 border-white/10 overflow-hidden bg-[#111]">
              {userInfo.user_avatar ? (
                <img src={userInfo.user_avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#151515]">
                    <span className="text-2xl font-bold">?</span>
                </div>
              )}
            </div>
            
            {/* Ім'я та ID */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{userInfo.user_name}</h1>
              <div className="flex items-center gap-3">
                 <span className="text-sm font-mono text-gray-500 bg-[#111] px-2 py-1 rounded border border-white/5">
                   ID: {id}
                 </span>
                 <span className="text-sm text-gray-400">
                   Total Works: <strong className="text-white">{assets.length}</strong>
                 </span>
              </div>
            </div>
          </div>
        )}

        {/* --- 2. СІТКА РОБІТ --- */}
        {loading ? (
           <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
           </div>
        ) : assets.length === 0 ? (
           <div className="text-center py-32 text-gray-600">
             <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
             <p className="text-xl font-medium">This user hasn't uploaded anything yet.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-lg transition hover:border-white/30">
                
                {/* Картинка */}
                <div className="aspect-square bg-black relative">
                  <img 
                    src={`https://bfcuoffgxfdkzjloousm.supabase.co/storage/v1/object/public/uploads/${asset.file_path}`} 
                    alt={asset.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition duration-500"
                  />
                  
                  {/* --- МІТКА СТАТУСУ (Зверху зліва) --- */}
                  <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg border flex items-center gap-1.5 ${
                    asset.status === 'approved' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : asset.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {asset.status === 'approved' && <CheckCircleIcon className="h-3.5 w-3.5" />}
                    {asset.status === 'rejected' && <XCircleIcon className="h-3.5 w-3.5" />}
                    {asset.status === 'pending' && <ClockIcon className="h-3.5 w-3.5" />}
                    {asset.status}
                  </div>

                  {/* Кнопка скачування */}
                  <button 
                    onClick={() => downloadImage(asset.file_path, asset.title)}
                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-md transition opacity-0 group-hover:opacity-100"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Інформація знизу */}
                <div className="p-4 border-t border-white/5 bg-[#161616]">
                  <h3 className="text-white font-bold text-sm truncate">{asset.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] uppercase text-gray-500 font-bold bg-[#222] px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}