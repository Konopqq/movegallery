"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all'; 
  
  const supabase = createClient();

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      
      let query = supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching assets:', error);
      } else {
        setAssets(data || []);
      }
      setLoading(false);
    };

    fetchAssets();
  }, [filter]);

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
      alert('Download failed');
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-10 px-4 md:px-8">
      
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ADE80]"></div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {assets.map((asset) => (
            <div 
              key={asset.id} 

              onClick={() => setSelectedAsset(asset)}
              className="group relative bg-[#111] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col cursor-pointer"
            >
              
              <div className="aspect-[4/3] bg-black overflow-hidden relative">
                <img 
                  src={`https://bfcuoffgxfdkzjloousm.supabase.co/storage/v1/object/public/uploads/${asset.file_path}`} 
                  alt={asset.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    downloadImage(asset.file_path, asset.title);
                  }}
                  className="absolute bottom-4 right-4 bg-white text-black p-2.5 rounded-full translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#4ADE80] shadow-lg cursor-pointer z-20"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-white font-bold text-base truncate pr-2">{asset.title}</h3>
                </div>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {asset.user_avatar ? (
                      <img src={asset.user_avatar} alt="User" className="w-5 h-5 rounded-full border border-white/20" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-700 border border-white/20"></div>
                    )}
                    <span className="text-xs text-gray-400 font-medium truncate max-w-[100px]">
                      {asset.user_name || "Unknown"}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase bg-white/5 text-gray-500 px-2 py-0.5 rounded border border-white/5">
                     {asset.category}
                   </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && assets.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-xl">No assets found here.</p>
        </div>
      )}


      {selectedAsset && (
        <div 
            onClick={() => setSelectedAsset(null)} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
            
            <button className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                <XMarkIcon className="h-8 w-8" />
            </button>

            <img 
                src={`https://bfcuoffgxfdkzjloousm.supabase.co/storage/v1/object/public/uploads/${selectedAsset.file_path}`} 
                alt={selectedAsset.title}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                onClick={(e) => {
                    e.stopPropagation(); 
                    setSelectedAsset(null);
                }}
            />

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p className="text-white font-bold text-lg text-shadow">{selectedAsset.title}</p>
                <p className="text-gray-400 text-sm">by {selectedAsset.user_name || "Unknown"}</p>
            </div>
        </div>
      )}

    </main>
  );
}