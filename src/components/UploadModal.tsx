"use client";
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { ExclamationCircleIcon, XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export default function UploadModal({ isOpen, onClose, isAdmin }: UploadModalProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('art');
  const [loading, setLoading] = useState(false);
  
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const showErrorMessage = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        showErrorMessage("File is too large! Max size is 10MB.");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setTitle(selected.name.split('.')[0]);
    }
  };

  const handleSubmit = async () => {
    const userId = (session?.user as any)?.id;
    // Отримуємо ім'я та аватар з сесії
    const userName = session?.user?.name || 'Anonymous';
    const userAvatar = session?.user?.image || '';
    
    if (!session || !userId) {
        showErrorMessage("Authorization failed. Please log in.");
        return;
    }
    if (!file) {
        showErrorMessage("Please select a file to upload.");
        return;
    }
    
    setLoading(true);

    try {
      if (!isAdmin) {
        const { data: pending } = await supabase.from('assets')
          .select('id')
          .eq('discord_user_id', userId)
          .eq('status', 'pending');
        
        if (pending && pending.length > 0) {
          showErrorMessage("You already have a pending submission. Please wait for approval.");
          setLoading(false);
          return;
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: upErr } = await supabase.storage.from('uploads').upload(fileName, file);
      if (upErr) throw upErr;

      const status = isAdmin ? 'approved' : 'pending';

      // ЗАПИСУЄМО ІМ'Я ТА АВАТАР В БАЗУ
      const { error: dbErr } = await supabase.from('assets').insert([{
        title: title,
        category: category,
        file_path: fileName,
        discord_user_id: userId,
        user_name: userName,     // <--- Нове поле
        user_avatar: userAvatar, // <--- Нове поле
        status: status
      }]);

      if (dbErr) throw dbErr;

      setFile(null);
      setPreview(null);
      setTitle('');
      onClose();
      router.refresh();

    } catch (error: any) {
      console.error(error);
      showErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {errorToast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-red-600/95 text-white px-5 py-4 rounded-xl shadow-2xl border border-red-400/50 backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300 max-w-sm">
          <ExclamationCircleIcon className="h-6 w-6 shrink-0 text-white" />
          <div className="flex flex-col">
            <span className="font-bold text-sm">Error</span>
            <span className="text-sm opacity-90 leading-tight">{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="ml-2 hover:text-gray-200 transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Upload Asset</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition bg-white/5 p-1 rounded-full">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>

        <div className="space-y-5">
          {!preview ? (
            <label className="block w-full h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#4ADE80] hover:bg-[#4ADE80]/5 transition group bg-[#161616]">
              <CloudArrowUpIcon className="h-10 w-10 text-[#4ADE80] mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-gray-300 text-sm font-medium group-hover:text-white">Click to select image</span>
              <span className="text-gray-600 text-xs mt-1">JPG, PNG, GIF up to 10MB</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
            </label>
          ) : (
            <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden border border-white/10 group">
              <img src={preview} className="w-full h-full object-contain" alt="Preview" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => {setFile(null); setPreview(null)}} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transition transform hover:scale-105">
                    Change File
                  </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold tracking-wider">Asset Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] outline-none transition-all placeholder-gray-600 text-sm" placeholder="e.g. Cyberpunk City 2077" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase font-bold tracking-wider">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {['logo', 'moveus', 'fon', 'text', 'art'].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${category === cat ? 'bg-[#4ADE80] text-black border-[#4ADE80] shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'bg-[#1A1A1A] text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button disabled={!file || loading} onClick={handleSubmit} className={`w-full py-4 rounded-xl font-bold mt-2 transition-all transform active:scale-[0.98] ${!file || loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#4ADE80] text-black hover:bg-[#3bd172] shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.4)]'}`}>
            {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>Uploading...</span> : 'Submit Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}