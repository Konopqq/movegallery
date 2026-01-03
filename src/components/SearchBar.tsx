"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  
  useEffect(() => {
    const currentSearch = searchParams.get('search');
    if (currentSearch) {
        setQuery(currentSearch);
        setIsOpen(true);
    }
  }, [searchParams]);

  
  useEffect(() => {
    const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
            if (params.get('search') !== query) {
                params.set('search', query);
                router.push(`/?${params.toString()}`);
            }
        } else {
            if (params.get('search')) {
                params.delete('search');
                router.push(`/?${params.toString()}`);
            }
        }
    }, 500); 

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative flex items-center">
      
      
      <div 
        className={`absolute right-10 top-1/2 -translate-y-1/2 h-9 transition-all duration-300 ease-out origin-right flex items-center ${
          isOpen ? 'w-64 opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full">
            <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..." 
                className="w-full h-full bg-[#111] border border-white/20 rounded-lg pl-4 pr-8 text-sm text-white focus:outline-none focus:border-green-500/50 focus:bg-[#0a0a0a] shadow-xl placeholder-gray-500"
            />
            
            {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                   <XMarkIcon className="h-4 w-4" />
                </button>
            )}
        </div>
      </div>

      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all duration-300 z-10 ${
            isOpen 
            ? 'text-green-400 bg-white/5' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
      </button>
    </div>
  );
}