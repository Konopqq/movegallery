"use client";
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowDownTrayIcon, 
  PhotoIcon, 
  XMarkIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';


function HomeContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
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

      const { data } = await query;
      if (data) setAssets(data);
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
      alert('Error downloading');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        
        {loading ? (
           <div className="flex justify-center py-32">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
           </div>
        ) : assets.length === 0 ? (
           <div className="text-center py-32 text-gray-600">
             <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
             <p className="text-xl font-medium">No artworks found for "{filter}".</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <div key={asset.id} onClick={() => setSelectedAsset(asset)} className="group relative bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-lg transition hover:border-white/30 cursor-pointer">
                
                <div className="aspect-square bg-black relative">
                  <img 
                    src={`https://bfcuoffgxfdkzjloousm.supabase.co/storage/v1/object/public/uploads/${asset.file_path}`} 
                    alt={asset.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition duration-500"
                  />
                  
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadImage(asset.file_path, asset.title); }}
                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-md transition opacity-0 group-hover:opacity-100"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                </div>

                
                <div className="p-4 border-t border-white/5 bg-[#161616]">
                  <h3 className="text-white font-bold text-sm truncate">{asset.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] uppercase text-gray-500 font-bold bg-[#222] px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      By: {asset.user_name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        
        {selectedAsset && (
            <div onClick={() => setSelectedAsset(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out">
                <button className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                    <XMarkIcon className="h-8 w-8" />
                </button>
                <img 
                    src={`https://bfcuoffgxfdkzjloousm.supabase.co/storage/v1/object/public/uploads/${selectedAsset.file_path}`} 
                    alt={selectedAsset.title} 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(null); }}
                />
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                    <p className="text-white font-bold text-lg text-shadow">{selectedAsset.title}</p>
                    <p className="text-gray-400 text-sm mt-1">By {selectedAsset.user_name || 'Unknown'}</p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}


export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <HomeContent />
    </Suspense>
  );
}