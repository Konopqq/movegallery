"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, Suspense } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import UploadModal from './UploadModal';
import NotificationBell from './NotificationBell';


function NavbarInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const supabase = createClient();


  useEffect(() => {
    const checkAdminStatus = async () => {
      const userId = (session?.user as any)?.id;
      if (!userId) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('admins')
        .select('id')
        .eq('discord_id', userId)
        .single();

      if (data) setIsAdmin(true);
      else setIsAdmin(false);
    };

    if (session) checkAdminStatus();
  }, [session]);

  const setFilter = (cat: string) => {
    router.push(`/?filter=${cat}`);
  };

  const handleUploadClick = () => {
    if (!session) {
      alert("Please login first!");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505] border-b border-white/10 h-16 flex items-center justify-between px-6">
        
        
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition shrink-0">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-white whitespace-nowrap">
            Move Industries
          </span>
        </Link>

        
        <div className="hidden md:flex items-center gap-1 bg-[#111] p-1 rounded-lg border border-white/5">
          {['all', 'logo', 'moveus', 'fon', 'text', 'art'].map((cat) => (
              <button 
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                      currentFilter === cat 
                      ? 'bg-white text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
          ))}
        </div>

        
        <div className="flex items-center gap-4">
          
          {session && <NotificationBell />}
          
          <button 
             onClick={handleUploadClick}
             className="flex items-center gap-2 px-4 py-2 bg-[#222] hover:bg-[#333] border border-white/10 rounded-md transition"
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
             <span className="text-sm font-bold text-white">Upload</span>
          </button>

          {session ? (
              <div className="relative group h-full flex items-center">
                  <img 
                      src={session.user?.image || ""} 
                      alt="Profile" 
                      className="w-9 h-9 rounded-full border border-white/20 cursor-pointer"
                  />
                  <div className="absolute right-0 top-6 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="w-40 bg-[#111] border border-white/10 rounded-lg shadow-xl overflow-hidden flex flex-col p-1">
                          <Link href={`/profile/${session.user?.image?.split('/')[4]}`} className="px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded text-left">
                              My Profile
                          </Link>
                          
                          {isAdmin && (
                            <Link href="/admin" className="px-3 py-2 text-sm text-yellow-400 hover:bg-white/10 rounded text-left font-bold">
                                Admin Panel
                            </Link>
                          )}
                          
                          <div className="h-[1px] bg-white/5 my-1"></div>
                          <button onClick={() => signOut()} className="px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded text-left">
                              Log Out
                          </button>
                      </div>
                  </div>
              </div>
          ) : (
              <button onClick={() => signIn('discord')} className="text-sm font-bold text-white hover:text-[#4ADE80] transition">
                Login
              </button>
          )}
        </div>
      </nav>

      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isAdmin={isAdmin} 
      />
    </>
  );
}


export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-[#050505] border-b border-white/10 fixed top-0 z-50" />}>
      <NavbarInner />
    </Suspense>
  );
}