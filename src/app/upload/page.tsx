'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UploadFile } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function StudyUploadUI() {
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [focusAreas, setFocusAreas] = useState("");
  const [studyDepth, setStudyDepth] = useState<"1hr" | "standard" | "detailed">("standard");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending" as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const depthOptions = [
    { label: "Fast", value: "1hr" },
    { label: "Standard", value: "standard" },
    { label: "Deep Dive", value: "detailed" }
  ];

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f.file));
      if (focusAreas) formData.append('focusAreas', focusAreas);
      formData.append('studyDepth', studyDepth);
      if (user) formData.append('userId', user.id);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      const response = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              if (!user && data.sessionId) {
                const existing = JSON.parse(localStorage.getItem('anonSessions') || '[]');
                if (!existing.includes(data.sessionId)) {
                  existing.push(data.sessionId);
                  localStorage.setItem('anonSessions', JSON.stringify(existing));
                }
              }
              resolve(data);
            } else {
              reject(new Error(data.error || 'Upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });

      router.push(`/processing?sessionId=${response.sessionId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen upload-container bg-[#0a0a0a] text-[#aaaaaa] font-sans flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-6xl mb-8 flex items-center justify-between z-10">
         <Link href="/dashboard" className="text-[#555] hover:text-white transition flex items-center gap-2 font-mono text-sm">
           <ArrowLeft className="w-4 h-4" /> Back to Dashboard
         </Link>
         <div className="font-mono text-xs text-[#555]">Study UI</div>
      </div>
      
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10 z-10">
        
        {/* Upload Zone */}
        <label 
          className="relative border border-dashed border-[#2a2a2a] rounded-[2px] flex flex-col items-center justify-center min-h-[400px] h-full bg-noise bg-[#111111] cursor-pointer group overflow-hidden transition-all duration-300"
          style={isDragging ? { borderColor: '#aaaaaa', scale: 1.02, backgroundColor: '#1a1a1a' } : {}}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            className="hidden" 
            multiple
            accept=".pdf,.docx,.doc,.pptx,.txt,.md"
            onChange={e => {
              if (e.target.files) addFiles(Array.from(e.target.files));
            }} 
            ref={fileInputRef}
          />

          {/* Animated border */}
          <div className="absolute inset-0 rounded-[2px] pointer-events-none group-hover:opacity-100 opacity-0 transition duration-300" style={{
            background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 6px, transparent 6px, transparent 12px)",
            animation: "dash 1s linear infinite"
          }} />

          <div className="flex flex-col items-center gap-4 transition-transform duration-300 group-hover:-translate-y-2">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDragging ? "#ffffff" : "#aaaaaa"} strokeWidth="1.5">
              <path d="M12 16V4" />
              <path d="M8 8l4-4 4 4" />
              <path d="M4 20h16" />
            </svg>
            <p className="text-sm text-[#555555] font-mono tracking-tight text-center px-4">
              {isDragging ? 'Drop files here' : 'Drag and drop or click to browse'}
            </p>
          </div>
        </label>

        {/* File Card & Options */}
        <div className="relative flex flex-col justify-center min-h-[400px]">
          <AnimatePresence>
            {files.length > 0 ? (
              <motion.div
                key="options-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8 w-full"
              >
                
                {/* File List */}
                <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar max-h-[240px]">
                  <AnimatePresence>
                     {files.map((file) => (
                        <motion.div 
                          key={file.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-[2px] border border-[#2a2a2a] shadow-sm"
                        >
                          <div className="flex items-center gap-4 overflow-hidden">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" className="flex-shrink-0">
                              <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#e0e0e0] truncate">{file.name}</p>
                              <p className="text-[12px] text-[#666] font-mono mt-0.5">
                                {formatSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => removeFile(file.id)} className="p-2 hover:bg-[#2a2a2a] rounded-[2px] transition text-[#666] hover:text-[#e0e0e0]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.div>
                     ))}
                  </AnimatePresence>
                </div>

                {/* Configuration Stack */}
                <div className="flex flex-col gap-8">
                  {/* Focus Input */}
                  <input
                    value={focusAreas}
                    onChange={(e) => setFocusAreas(e.target.value)}
                    placeholder="Focus areas (optional) e.g. Chapter 3, Key Definitions"
                    className="w-full px-5 py-4 rounded-[2px] bg-[#1a1a1a] border border-[#2a2a2a] text-[15px] text-[#e0e0e0] outline-none placeholder:text-[#666] focus:border-[#444] transition-colors shadow-sm"
                  />
                  
                  {/* Session Depth */}
                  <div className="flex flex-col gap-4">
                    <p className="text-[11px] font-mono text-[#666] uppercase tracking-[0.15em] ml-1">
                      Session Depth
                    </p>
                    <div className="relative flex bg-[#1a1a1a] rounded-[2px] p-1.5 border border-[#2a2a2a] shadow-sm">
                      {depthOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStudyDepth(opt.value as any)}
                          className={`flex-1 text-[13px] py-3 rounded-[2px] z-10 transition-colors font-medium tracking-wide ${studyDepth === opt.value ? 'text-black' : 'text-[#888] hover:text-[#bbb]'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute top-1.5 bottom-1.5 rounded-[2px] bg-white shadow-md"
                        style={{
                          width: 'calc(33.33% - 4px)',
                          left:
                            studyDepth === '1hr'
                              ? '4px'
                              : studyDepth === 'standard'
                              ? 'calc(33.33% + 2px)'
                              : 'calc(66.66% + 0px)'
                        }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-2">
                    <button 
                      onClick={handleSubmit}
                      disabled={isUploading}
                      className="w-full bg-[#f0f0f0] text-[#0a0a0a] py-4 rounded-[2px] text-[15px] font-semibold transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-[#0a0a0a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading... {uploadProgress}%
                        </>
                      ) : (
                        "Begin Processing →"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full border border-dashed border-[#222] rounded-2xl bg-[#0d0d0d]"
              >
                 <p className="text-[#444] font-mono text-sm text-center px-8">Upload a document to configure your study session.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap');
        
        @keyframes dash {
          to {
            background-position: 100px 0;
          }
        }

        .upload-container {
          font-family: 'DM Sans', sans-serif;
        }

        .upload-container .font-mono {
          font-family: 'IBM Plex Mono', monospace;
        }

        /* custom scrollbar for file list */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #333;
          border-radius: 10px;
        }

        /* subtle noise overlay */
        .upload-container::before {
           content: '';
           position: fixed;
           inset: 0;
           background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
           pointer-events: none;
           opacity: 0.4;
           z-index: 1;
        }
      `}} />
    </div>
  );
}
