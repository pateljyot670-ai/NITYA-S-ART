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
  LogIn
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
  OperationType
} from './firebase';
import { User } from 'firebase/auth';

const CATEGORIES: Category[] = ['All', 'Oil Painting', 'Digital Art', 'Sculpture', 'Photography', 'Lippan Art'];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
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
    }
  }, [selectedArtwork]);

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
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/60 via-transparent to-brand-cream z-10" />
          {artworks.length > 0 ? (
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              transition={{ duration: 2 }}
              src={artworks[0].imageUrl} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-brand-yellow/10" />
          )}
        </div>

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
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-8">
            <div>
              <h3 className="text-4xl font-light mb-4 tracking-tight text-brand-ink">The Collection</h3>
              <p className="text-brand-ink/60 max-w-md text-sm leading-relaxed">
                A curated selection of works spanning digital and traditional mediums, 
                celebrating the vibrant heritage of Lippan art and modern expression.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "text-[10px] uppercase tracking-[0.2em] px-6 py-2 rounded-full border-2 transition-all",
                    selectedCategory === cat 
                      ? "bg-brand-red text-white border-brand-red" 
                      : "border-brand-ink/10 text-brand-ink/40 hover:border-brand-red/40"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence mode="popLayout">
              {filteredArtworks.length > 0 ? (
                filteredArtworks.map((art, index) => (
                  <motion.div
                    layout
                    key={art.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedArtwork(art)}
                  >
                    <div className={cn(
                      "relative aspect-square overflow-hidden bg-brand-ink/5 mb-6 shadow-xl transition-all duration-500",
                      art.category === 'Lippan Art' ? "rounded-full border-4 border-brand-yellow/30" : "rounded-sm"
                    )}>
                      <img 
                        src={art.imageUrl} 
                        alt={art.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-brand-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-light tracking-tight mb-1 text-brand-ink">{art.title}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-brand-red font-bold">{art.medium}</p>
                      </div>
                      <span className="text-xs font-serif italic text-brand-ink/20">{art.year}</span>
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
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Title</label>
                  <input 
                    required
                    type="text"
                    value={newArt.title}
                    onChange={e => setNewArt(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/40 transition-colors text-white placeholder:text-white/20"
                    placeholder="Artwork Title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Category</label>
                    <select 
                      value={newArt.category}
                      onChange={e => setNewArt(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/40 transition-colors appearance-none text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-neutral-900 text-white">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Year</label>
                    <input 
                      type="text"
                      value={newArt.year}
                      onChange={e => setNewArt(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/40 transition-colors text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Image</label>
                  <div className="relative group">
                    <input 
                      required
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full aspect-video bg-white/5 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4 group-hover:bg-white/10 transition-all">
                      {newArt.imageUrl ? (
                        <img src={newArt.imageUrl} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-white/20" />
                          <p className="text-[10px] uppercase tracking-widest text-white/60">Click to upload image</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/60">Description</label>
                  <textarea 
                    value={newArt.description}
                    onChange={e => setNewArt(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/40 transition-colors h-32 resize-none text-white placeholder:text-white/20"
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

      {/* Artwork Modal */}
      <AnimatePresence>
        {selectedArtwork && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 bg-brand-cream/95 backdrop-blur-xl"
          >
            <button 
              onClick={() => setSelectedArtwork(null)}
              className="absolute top-8 right-8 p-2 hover:bg-brand-ink/5 rounded-full transition-colors z-[110] text-brand-ink"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "relative aspect-square overflow-hidden shadow-2xl transition-all duration-500",
                  selectedArtwork.category === 'Lippan Art' && !isZoomed ? "rounded-full border-8 border-brand-yellow/30" : "rounded-sm",
                  isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                )}
                onClick={() => setIsZoomed(!isZoomed)}
              >
                <motion.img 
                  animate={{ 
                    scale: isZoomed ? 1.5 : 1,
                    x: isZoomed ? 0 : 0, // Could add mouse follow here but scale is a good start
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  src={selectedArtwork.imageUrl} 
                  alt={selectedArtwork.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {!isZoomed && (
                  <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 pointer-events-none">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-[10px] uppercase tracking-[0.4em] text-brand-red font-bold mb-4 block">
                  {selectedArtwork.category} — {selectedArtwork.year}
                </span>
                <h2 className="text-5xl font-light mb-8 tracking-tight text-brand-ink">{selectedArtwork.title}</h2>
                <p className="text-brand-ink/70 leading-relaxed mb-12 text-lg font-light">
                  {selectedArtwork.description}
                </p>
                
                <div className="space-y-6 border-t border-brand-ink/10 pt-8">
                  <div className="flex justify-between text-xs uppercase tracking-widest">
                    <span className="text-brand-ink/40">Medium</span>
                    <span className="text-brand-ink font-bold">{selectedArtwork.medium}</span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-widest">
                    <span className="text-brand-ink/40">Dimensions</span>
                    <span className="text-brand-ink font-bold">{selectedArtwork.dimensions}</span>
                  </div>
                </div>

                <button className="mt-12 w-full py-4 bg-brand-red text-white text-xs uppercase tracking-[0.3em] font-bold hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20">
                  Inquire About This Piece
                </button>
              </motion.div>
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
    </div>
  );
}
