import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Menu, 
  X, 
  Instagram, 
  Twitter, 
  Mail, 
  ArrowRight,
  Maximize2,
  Info,
  Plus,
  LogOut,
  LogIn,
  ArrowLeft,
  Share2,
  Copy,
  Download,
  Trash2
} from 'lucide-react';
import { cn } from './lib/utils';
import { ARTWORKS } from './constants';
import { Artwork, Category } from './types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  isUserAdmin,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  handleFirestoreError,
  OperationType,
  deleteDoc,
  doc
} from './firebase';
import { User } from 'firebase/auth';

const CATEGORIES: Category[] = ['All', 'Oil Painting', 'Digital Art', 'Sculpture', 'Photography', 'Lippan Art'];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [newArt, setNewArt] = useState<Partial<Artwork>>({
    title: '',
    category: 'Lippan Art',
    medium: 'Traditional Mud and Mirror Work',
    year: new Date().getFullYear().toString(),
    description: ''
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);

  const handleDelete = async () => {
    if (!artworkToDelete || !isAdmin) return;
    
    try {
      await deleteDoc(doc(db, 'artworks', artworkToDelete.id));
      setIsDeleteConfirmOpen(false);
      setArtworkToDelete(null);
      if (selectedArtwork?.id === artworkToDelete.id) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `artworks/${artworkToDelete.id}`);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(isUserAdmin(currentUser));
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Data Listener
  useEffect(() => {
    if (!isAuthReady) return;

    const q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const arts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Artwork[];
      
      // If no artworks in DB, fallback to constants for initial view
      setArtworks(arts.length > 0 ? arts : ARTWORKS);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'artworks');
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      // Ignore common "user cancelled" errors to keep console clean
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Login failed:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        // Compress image before setting it to state
        const compressed = await compressImage(base64);
        setNewArt(prev => ({ ...prev, imageUrl: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !user) return;

    if (newArt.title && newArt.imageUrl) {
      try {
        const artworkData = {
          ...newArt,
          authorUid: user.uid,
          createdAt: Timestamp.now(),
        };
        
        await addDoc(collection(db, 'artworks'), artworkData);
        
        setIsAddModalOpen(false);
        setNewArt({
          title: '',
          category: 'Lippan Art',
          medium: 'Traditional Mud and Mirror Work',
          year: new Date().getFullYear().toString(),
          description: ''
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'artworks');
      }
    }
  };

  const filteredArtworks = useMemo(() => {
    if (selectedCategory === 'All') return artworks;
    return artworks.filter(art => art.category === selectedCategory);
  }, [selectedCategory, artworks]);

  useEffect(() => {
    if (!selectedArtwork) {
      setIsZoomed(false);
      setIsFullScreen(false);
    }
  }, [selectedArtwork]);

  const handleDownload = async () => {
    if (!selectedArtwork) return;
    try {
      const response = await fetch(selectedArtwork.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedArtwork.title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCopy = async () => {
    if (!selectedArtwork) return;
    try {
      await navigator.clipboard.writeText(selectedArtwork.imageUrl);
      // Optional: Show a toast or feedback
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleShare = async () => {
    if (!selectedArtwork) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedArtwork.title,
          text: selectedArtwork.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-brand-red selection:text-white">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-yellow/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-brand-red/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-brand-blue/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-light tracking-[0.2em] uppercase text-brand-red"
        >
          Nitya's Art
        </motion.h1>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-medium text-brand-ink/60">
            {['Gallery', 'Exhibitions', 'About', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-brand-red transition-colors">
                {item}
              </a>
            ))}
          </div>

          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-brand-ink/60 hover:text-brand-red transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-brand-ink/60 hover:text-brand-red transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Login</span>
            </button>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors text-brand-ink"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col justify-center px-6 md:px-24 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-brand-cream" />

        <div className="relative z-20 max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xs uppercase tracking-[0.4em] mb-6 text-brand-red font-bold"
          >
            Featured Exhibition 2024
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-6xl md:text-9xl font-light leading-none mb-12 tracking-tighter text-brand-ink"
          >
            VIBRANT <br />
            <span className="italic font-serif ml-12 md:ml-24 text-brand-blue">COLORS</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <button className="group flex items-center gap-4 text-sm uppercase tracking-widest border-2 border-brand-red px-8 py-4 rounded-full hover:bg-brand-red hover:text-white transition-all text-brand-red font-bold">
              Explore Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>

        <div className="absolute bottom-12 right-12 hidden md:block">
          <div className="flex flex-col gap-6">
            <Instagram className="w-5 h-5 text-brand-ink/40 hover:text-brand-red cursor-pointer transition-colors" />
            <Twitter className="w-5 h-5 text-brand-ink/40 hover:text-brand-red cursor-pointer transition-colors" />
            <Mail className="w-5 h-5 text-brand-ink/40 hover:text-brand-red cursor-pointer transition-colors" />
          </div>
        </div>
      </header>

      {/* Gallery Section */}
      <section id="gallery" className="py-32 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Gallery Header - Dashboard Style */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-brand-ink/5 pb-12">
            <div className="space-y-4">
              <h3 className="text-5xl font-light tracking-tight text-brand-ink">Archive <span className="text-brand-ink/20 font-mono text-2xl">v1.0</span></h3>
              <div className="flex gap-8 pt-2">
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-widest text-brand-ink/40 mb-1">Total Assets</span>
                  <span className="text-xl font-mono">{artworks.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase tracking-widest text-brand-ink/40 mb-1">Categories</span>
                  <span className="text-xl font-mono">{CATEGORIES.length - 1}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "text-[9px] font-mono uppercase tracking-widest px-4 py-2 rounded-md border transition-all",
                    selectedCategory === cat 
                      ? "bg-brand-ink text-white border-brand-ink" 
                      : "border-brand-ink/10 text-brand-ink/40 hover:border-brand-ink/40 hover:bg-brand-ink/5"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredArtworks.length > 0 ? (
                filteredArtworks.map((art, index) => (
                  <motion.div
                    layout
                    key={art.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -8 }}
                    transition={{ 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    className="group cursor-pointer"
                    onClick={() => {
                      setSelectedArtwork(art);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className={cn(
                      "relative aspect-square overflow-hidden bg-brand-ink/5 mb-4 shadow-sm transition-all duration-500 group-hover:shadow-md border border-brand-ink/5",
                      "rounded-lg"
                    )}>
                      <img 
                        src={art.imageUrl} 
                        alt={art.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setArtworkToDelete(art);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="absolute top-2 left-2 z-20 w-8 h-8 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center border border-brand-red/20 shadow-sm text-brand-red hover:bg-brand-red hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-8 h-8 rounded-md bg-white/90 backdrop-blur-md flex items-center justify-center border border-brand-ink/10 shadow-sm">
                          <Info className="w-4 h-4 text-brand-ink" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-brand-red">{art.category}</span>
                        <span className="text-[8px] font-mono text-brand-ink/30">#{art.id.slice(0, 4)}</span>
                      </div>
                      <h4 className="text-sm font-medium tracking-tight text-brand-ink group-hover:text-brand-red transition-colors truncate">{art.title}</h4>
                      <div className="flex items-center justify-between pt-1 border-t border-brand-ink/5">
                        <span className="text-[9px] font-mono text-brand-ink/40 uppercase tracking-tighter">{art.medium || 'Mixed Media'}</span>
                        <span className="text-[9px] font-mono text-brand-ink/60">{art.year}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-brand-ink/10 rounded-2xl">
                  <p className="text-brand-ink/20 uppercase tracking-[0.3em] text-xs">No artworks to display</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-brand-ink/5 bg-brand-ink text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-light tracking-[0.3em] uppercase mb-4 text-brand-yellow">Nitya's Art</h2>
            <p className="text-white/40 text-xs tracking-widest uppercase">© 2024 All Rights Reserved</p>
          </div>
          
          <div className="flex gap-12 text-[10px] uppercase tracking-[0.3em] font-medium text-white/40">
            <a href="#" className="hover:text-brand-yellow transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-yellow transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-yellow transition-colors">Press</a>
          </div>

          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-red hover:border-brand-red transition-all cursor-pointer">
              <Instagram className="w-4 h-4" />
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-blue hover:border-brand-blue transition-all cursor-pointer">
              <Twitter className="w-4 h-4" />
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-yellow hover:border-brand-yellow hover:text-brand-ink transition-all cursor-pointer">
              <Mail className="w-4 h-4" />
            </div>
          </div>
        </div>
      </footer>


      {/* Add Artwork Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-neutral-900/50 border border-white/10 rounded-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-light tracking-widest uppercase text-brand-red">Add New Artwork</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-brand-red transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddArt} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Title</label>
                  <input 
                    required
                    type="text"
                    value={newArt.title}
                    onChange={e => setNewArt(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors text-white placeholder:text-white/40"
                    placeholder="Artwork Title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Category</label>
                    <select 
                      value={newArt.category}
                      onChange={e => setNewArt(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors appearance-none text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-neutral-900 text-white">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Year</label>
                    <input 
                      type="text"
                      value={newArt.year}
                      onChange={e => setNewArt(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Image</label>
                  <div className="relative group">
                    <input 
                      required
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full aspect-video bg-white/10 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-4 group-hover:bg-white/20 transition-all">
                      {newArt.imageUrl ? (
                        <img src={newArt.imageUrl} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-white/40" />
                          <p className="text-[10px] uppercase tracking-widest text-white/80">Click to upload image</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Description</label>
                  <textarea 
                    value={newArt.description}
                    onChange={e => setNewArt(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors h-32 resize-none text-white placeholder:text-white/40"
                    placeholder="Describe your artwork..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-red text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-lg hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                >
                  Publish to Gallery
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View Modal (The Step from your Screenshot) */}
      <AnimatePresence>
        {isDetailOpen && selectedArtwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-brand-cream overflow-y-auto"
          >
            <div className="min-h-screen flex flex-col">
              {/* Header */}
              <div className="p-6 flex justify-between items-center sticky top-0 bg-brand-cream/80 backdrop-blur-md z-10">
                <button 
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedArtwork(null);
                  }}
                  className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-4">
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setArtworkToDelete(selectedArtwork);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="p-2 hover:bg-brand-red/10 text-brand-red rounded-full transition-colors"
                      title="Delete Artwork"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={handleShare} className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsDetailOpen(false);
                      setSelectedArtwork(null);
                    }}
                    className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 max-w-4xl mx-auto w-full px-6 pb-24">
                {/* Image Section */}
                <div className="relative mb-16 flex justify-center">
                  <motion.div
                    layoutId={`art-${selectedArtwork.id}`}
                    className={cn(
                      "relative group cursor-zoom-in",
                      selectedArtwork.category === 'Lippan Art' ? "w-72 h-72 md:w-96 md:h-96 rounded-full shadow-2xl overflow-hidden border-8 border-white" : "w-full rounded-2xl shadow-2xl overflow-hidden"
                    )}
                    onClick={() => setIsFullScreen(true)}
                  >
                    <img 
                      src={selectedArtwork.imageUrl} 
                      alt={selectedArtwork.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-brand-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 shadow-xl">
                        <Maximize2 className="w-4 h-4 text-brand-red" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-brand-ink">View Big Size</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Text Section */}
                <div className="space-y-12">
                  <div>
                    <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-brand-red font-bold mb-4">
                      {selectedArtwork.category} — {selectedArtwork.year}
                    </p>
                    <h2 className="text-5xl md:text-7xl font-light tracking-tighter text-brand-ink mb-8 uppercase">
                      {selectedArtwork.title}
                    </h2>
                    <div className="w-24 h-px bg-brand-ink/10" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h5 className="text-[10px] uppercase tracking-[0.3em] text-brand-ink/40 font-bold mb-3">Medium</h5>
                        <p className="text-sm md:text-base font-bold text-brand-ink uppercase leading-relaxed">
                          {selectedArtwork.medium}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-[10px] uppercase tracking-[0.3em] text-brand-ink/40 font-bold mb-3">Dimensions</h5>
                        <p className="text-sm md:text-base font-medium text-brand-ink/60 uppercase">
                          {selectedArtwork.dimensions || 'Dimensions on Request'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <p className="text-brand-ink/70 leading-relaxed font-serif italic text-lg">
                        {selectedArtwork.description || "This piece represents a fusion of traditional techniques and modern artistic vision, exploring themes of heritage and contemporary expression."}
                      </p>
                      <div className="flex gap-4 pt-4">
                        <button className="flex-1 py-4 bg-brand-red text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20">
                          Inquire About Piece
                        </button>
                        <button 
                          onClick={handleDownload}
                          className="p-4 border-2 border-brand-ink/10 rounded-full hover:border-brand-red hover:text-brand-red transition-all"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen View (Big Size) */}
      <AnimatePresence>
        {isFullScreen && selectedArtwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 opacity-40">
              <img 
                src={selectedArtwork.imageUrl} 
                className="w-full h-full object-cover blur-3xl scale-110"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Header Controls */}
            <div className="relative z-20 p-6 flex items-center justify-between">
              <button 
                onClick={() => {
                  setIsFullScreen(false);
                }}
                className="group flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Back to Details</span>
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleShare}
                  className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all border border-white/10"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDownload}
                  className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all border border-white/10"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-12">
              {/* Navigation Buttons */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = filteredArtworks.findIndex(art => art.id === selectedArtwork.id);
                  const prevIndex = (currentIndex - 1 + filteredArtworks.length) % filteredArtworks.length;
                  setSelectedArtwork(filteredArtworks[prevIndex]);
                  setIsZoomed(false);
                }}
                className="absolute left-4 md:left-12 z-30 p-4 bg-white/5 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/5"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = filteredArtworks.findIndex(art => art.id === selectedArtwork.id);
                  const nextIndex = (currentIndex + 1) % filteredArtworks.length;
                  setSelectedArtwork(filteredArtworks[nextIndex]);
                  setIsZoomed(false);
                }}
                className="absolute right-4 md:right-12 z-30 p-4 bg-white/5 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/5"
              >
                <ArrowRight className="w-6 h-6" />
              </button>

              {/* Image Display */}
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  key={selectedArtwork.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "relative max-w-full max-h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700",
                    selectedArtwork.category === 'Lippan Art' && !isZoomed ? "rounded-full border-[12px] border-brand-yellow/20" : "rounded-lg",
                    isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                  )}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <motion.img
                    animate={{ scale: isZoomed ? 1.5 : 1 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                    src={selectedArtwork.imageUrl}
                    alt={selectedArtwork.title}
                    className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-inherit"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-brand-cream flex flex-col items-center justify-center gap-10"
            >
              {isAdmin && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-8 py-4 bg-brand-red text-white rounded-full shadow-2xl shadow-brand-red/40 mb-4"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm uppercase tracking-[0.3em] font-bold">Add New Artwork</span>
                </motion.button>
              )}

              {['Gallery', 'Exhibitions', 'About', 'Contact'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                className="text-4xl font-light tracking-widest uppercase hover:italic transition-all text-brand-ink hover:text-brand-red"
              >
                {item}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-brand-ink/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-brand-ink/5"
            >
              <div className="w-16 h-16 rounded-full bg-brand-red/10 flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-brand-red" />
              </div>
              <h3 className="text-xl font-medium text-center mb-2 text-brand-ink">Delete Artwork?</h3>
              <p className="text-brand-ink/60 text-sm text-center mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-brand-ink">"{artworkToDelete?.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setArtworkToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl border border-brand-ink/10 text-brand-ink/60 text-sm font-medium hover:bg-brand-ink/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 rounded-xl bg-brand-red text-white text-sm font-medium hover:bg-brand-red/90 transition-colors shadow-lg shadow-brand-red/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
