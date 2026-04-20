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
  Trash2,
  Link2,
  LayoutDashboard,
  Edit,
  Settings
} from 'lucide-react';
import { cn } from './lib/utils';
import { ARTWORKS } from './constants';
import { Artwork, Category, Section } from './types';
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
  doc,
  updateDoc,
  setDoc
} from './firebase';
import { User } from 'firebase/auth';

const CATEGORIES: Category[] = ['All', 'CANVAS PAINTING', 'Digital Art', 'Sculpture', 'Photography', 'Lippan Art', 'MANDALA ART', 'WARLI PAINTING', 'WATER COLOUR PAINTING', 'DESIGNED PRODUCT'];

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298L17.609 20.643z" />
  </svg>
);

const ShareModal = ({ isOpen, onClose, title, url }: { isOpen: boolean, onClose: () => void, title: string, url: string }) => {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon />,
      url: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      color: 'bg-[#25D366]'
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'bg-[#1877F2]'
    },
    {
      name: 'X (Twitter)',
      icon: <XIcon />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: 'bg-black'
    },
    {
      name: 'Copy Link',
      icon: <Link2 className="w-5 h-5" />,
      action: () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      color: 'bg-brand-ink'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-brand-ink/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-brand-ink/5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-brand-ink">Share</h3>
              <button onClick={onClose} className="p-2 hover:bg-brand-ink/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {shareLinks.map(link => (
                <a 
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={link.action ? (e) => { e.preventDefault(); link.action(); } : undefined}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-xl text-white transition-all hover:scale-105",
                    link.color
                  )}
                >
                  {link.icon}
                  <span className="text-[10px] uppercase tracking-widest font-bold">
                    {link.name === 'Copy Link' && copied ? 'Copied!' : link.name}
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'gallery' | 'exhibitions' | 'about'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({ title: '', url: '' });
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [newArt, setNewArt] = useState<Partial<Artwork>>({
    title: '',
    category: 'Lippan Art',
    medium: 'CANVAS PAINTING',
    year: new Date().getFullYear().toString(),
    description: ''
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [artworkToEdit, setArtworkToEdit] = useState<Artwork | null>(null);
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!artworkToDelete || !isAdmin) return;
    
    try {
      await deleteDoc(doc(db, 'artworks', artworkToDelete.id));
      setIsDeleteConfirmOpen(false);
      setArtworkToDelete(null);
      if (selectedArtwork?.id === artworkToDelete.id) {
        setIsDetailOpen(false);
      }
    } catch (error: any) {
      if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
        setGlobalError('The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.');
      } else {
        handleFirestoreError(error, OperationType.DELETE, `artworks/${artworkToDelete.id}`);
      }
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
      
      // Only show artworks from the database
      setArtworks(arts);
    }, (error) => {
      if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
        setGlobalError('The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.');
      } else {
        handleFirestoreError(error, OperationType.LIST, 'artworks');
      }
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // Sections Listener
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubscribe = onSnapshot(collection(db, 'sections'), (snapshot) => {
      const sectionMap: Record<string, Section> = {};
      snapshot.docs.forEach(doc => {
        sectionMap[doc.id] = { ...doc.data(), id: doc.id } as Section;
      });
      setSections(sectionMap);
    }, (error) => {
      if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
        setGlobalError('The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.');
      } else {
        handleFirestoreError(error, OperationType.LIST, 'sections');
      }
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
      } catch (error: any) {
        if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
          setGlobalError('The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.');
        } else {
          handleFirestoreError(error, OperationType.CREATE, 'artworks');
        }
      }
    }
  };

  const handleEditArt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !artworkToEdit) return;

    try {
      const { id, ...data } = artworkToEdit;
      await updateDoc(doc(db, 'artworks', id), data);
      setIsEditModalOpen(false);
      setArtworkToEdit(null);
    } catch (error: any) {
      if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
        setGlobalError('The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.');
      } else {
        handleFirestoreError(error, OperationType.UPDATE, `artworks/${artworkToEdit.id}`);
      }
    }
  };

  const handleEditSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !sectionToEdit) return;

    try {
      const { id, ...data } = sectionToEdit;
      await setDoc(doc(db, 'sections', id), {
        ...data,
        updatedAt: Timestamp.now()
      });
      setIsEditSectionModalOpen(false);
      setSectionToEdit(null);
    } catch (error: any) {
      if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
        setGlobalError('The application has reached its daily free limit for database operations. This limit resets every 24 hours at midnight Pacific Time.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, `sections/${sectionToEdit.id}`);
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

  const handleShare = async (artwork?: Artwork) => {
    const shareTitle = "🎨 Where art meets emotion.\n\nDiscover a premium collection of contemporary fine art at Nitya’s Art Gallery — a digital sanctuary for creativity, elegance, and inspiration 🖼️✨\n\n🌐 Visit now:";
    const shareUrl = "https://nityasart.vercel.app/";
    
    setShareData({ title: shareTitle, url: shareUrl });

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Nitya's Art Gallery",
          text: shareTitle,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error("Share failed:", error);
          setIsShareModalOpen(true);
        }
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink font-sans selection:bg-brand-red selection:text-white">
      <AnimatePresence>
        {globalError && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[1000] bg-brand-red text-white p-4 text-center text-xs uppercase tracking-widest font-bold shadow-xl"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
              <span>{globalError}</span>
              <button 
                onClick={() => setGlobalError(null)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-yellow/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-brand-red/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-brand-blue/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center transition-all duration-300",
        "backdrop-blur-md bg-brand-cream/70 border-b border-brand-ink/5"
      )}>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl md:text-2xl font-serif font-bold tracking-[0.2em] text-brand-ink cursor-pointer"
          onClick={() => setCurrentView('home')}
        >
          NITYA'S ART
        </motion.h1>
        
        <div className="flex items-center gap-6 md:gap-12">
          <div className="hidden lg:flex gap-10 text-[10px] uppercase tracking-[0.3em] font-medium text-brand-ink/50">
            {['Gallery', 'Exhibitions', 'About', 'Contact'].map((item) => (
              <button 
                key={item} 
                onClick={() => {
                  if (item === 'Gallery') setCurrentView('gallery');
                  else if (item === 'Exhibitions') setCurrentView('exhibitions');
                  else if (item === 'About') setCurrentView('about');
                  else if (item === 'Contact') return;
                  else setCurrentView('home');
                }}
                className={cn(
                  "hover:text-brand-red transition-colors relative group",
                  item === 'Contact' && "cursor-default opacity-50 hover:text-brand-ink/50"
                )}
              >
                {item}
                {item !== 'Contact' && (
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-red transition-all group-hover:w-full" />
                )}
              </button>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors text-brand-ink group relative"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-brand-ink text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">Dashboard</span>
                </button>
              )}
              <button 
                onClick={() => handleShare()}
                className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors text-brand-ink group relative"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-brand-ink text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">Share</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-brand-ink/60 hover:text-brand-red transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleShare()}
                className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors text-brand-ink group relative"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-brand-ink text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">Share</span>
              </button>
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-brand-ink/60 hover:text-brand-red transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors text-brand-ink"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.header 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative min-h-screen flex flex-col justify-center px-6 md:px-24 pt-24 overflow-hidden"
          >
            <div className="absolute inset-0 z-0 bg-brand-cream" />
            
            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full border-[1px] border-brand-ink/5 rounded-full animate-pulse" />
              <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] border-[1px] border-brand-ink/5 rounded-full" />
            </div>

            <div className="relative z-20 max-w-5xl py-20">
              {isAdmin && (
                <button 
                  onClick={() => {
                    const heroSection = sections['hero'] || {
                      id: 'hero',
                      title: "NITYA'S ART GALLERY",
                      subtitle: "EST. 2024 • CURATED COLLECTION",
                      content: "A premium digital space dedicated to the preservation and exhibition of contemporary fine art and traditional crafts.",
                      updatedAt: new Date()
                    };
                    setSectionToEdit(heroSection);
                    setIsEditSectionModalOpen(true);
                  }}
                  className="mb-8 flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-[10px] uppercase tracking-widest rounded-full hover:bg-brand-red/90 transition-all"
                >
                  <Edit className="w-3 h-3" />
                  Edit Hero Section
                </button>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="h-[1px] w-12 bg-brand-red" />
                <p className="text-[10px] uppercase tracking-[0.5em] text-brand-red font-bold">
                  {sections['hero']?.subtitle || "EST. 2024 • CURATED COLLECTION"}
                </p>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-5xl sm:text-7xl md:text-[10rem] font-serif font-bold leading-[0.85] mb-12 md:mb-16 tracking-tighter text-brand-ink flex flex-col"
              >
                <span className="relative">
                  {sections['hero']?.title.split(' ').slice(0, 2).join(' ') || "NITYA'S ART"}
                  <span className="absolute -top-4 -right-8 text-xs font-sans tracking-[0.5em] text-brand-ink/20 hidden md:block">© COLLECTION</span>
                </span>
                <span className="italic md:ml-48 text-brand-blue/80 flex items-center gap-8 font-normal">
                  {sections['hero']?.title.split(' ').slice(2).join(' ') || "GALLERY"}
                  <div className="h-[2px] flex-grow bg-brand-ink/5 hidden md:block" />
                </span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12"
              >
                <button 
                  onClick={() => setCurrentView('gallery')}
                  className="group relative flex items-center gap-6 text-xs uppercase tracking-[0.3em] bg-brand-ink text-white px-10 md:px-12 py-5 md:py-6 rounded-full hover:bg-brand-red transition-all duration-500 overflow-hidden"
                >
                  <span className="relative z-10">Explore Collection</span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-2 transition-transform" />
                  <div className="absolute inset-0 bg-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>

                <div className="max-w-xs">
                  <p className="text-[10px] md:text-[11px] leading-relaxed text-brand-ink/50 tracking-wide uppercase">
                    {sections['hero']?.content || "A premium digital space dedicated to the preservation and exhibition of contemporary fine art and traditional crafts."}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-8 md:bottom-12 left-6 md:left-24 z-20">
              <div className="flex items-center gap-6 md:gap-8">
                <div className="flex gap-4 md:gap-6">
                  <Instagram className="w-4 h-4 text-brand-ink/30 hover:text-brand-red cursor-pointer transition-colors" />
                  <Twitter className="w-4 h-4 text-brand-ink/30 hover:text-brand-red cursor-pointer transition-colors" />
                  <Mail className="w-4 h-4 text-brand-ink/30 hover:text-brand-red cursor-pointer transition-colors" />
                </div>
                <div className="h-[1px] w-12 md:w-24 bg-brand-ink/10" />
                <span className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-brand-ink/30 font-mono">SCROLL TO DISCOVER</span>
              </div>
            </div>
          </motion.header>
        )}

        {currentView === 'gallery' && (
          <motion.section 
            key="gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            id="gallery" 
            className="py-32 px-6 md:px-12 relative z-10 min-h-screen"
          >
            <div className="max-w-7xl mx-auto">
              <button 
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-red mb-12 hover:gap-4 transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </button>
              {/* Gallery Header - Ultra Minimal Style */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 border-b border-brand-ink/5 pb-6">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-brand-ink"
                >
                  Collection
                </motion.h3>
                
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border transition-all duration-300",
                        selectedCategory === cat 
                          ? "bg-brand-ink text-white border-brand-ink" 
                          : "border-brand-ink/10 text-brand-ink/40 hover:border-brand-ink/30 hover:text-brand-ink"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-12">
                <AnimatePresence mode="popLayout">
                  {filteredArtworks.length > 0 ? (
                    filteredArtworks.map((art, index) => (
                      <motion.div
                        layout
                        key={art.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                          delay: (index % 4) * 0.1,
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className="group cursor-pointer"
                        onClick={() => {
                          setSelectedArtwork(art);
                          setIsDetailOpen(true);
                        }}
                      >
                        <div className={cn(
                          "relative aspect-square overflow-hidden bg-brand-ink/5 mb-6 transition-all duration-700 ease-out group-hover:shadow-2xl group-hover:shadow-brand-ink/10 rounded-2xl",
                        )}>
                          <img 
                            src={art.imageUrl} 
                            alt={art.title}
                            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-brand-ink/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                              <div className="bg-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl">
                                <Maximize2 className="w-4 h-4 text-brand-red" />
                                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-ink">View Details</span>
                              </div>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArtworkToDelete(art);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center border border-brand-red/20 shadow-sm text-brand-red hover:bg-brand-red hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArtworkToEdit(art);
                                  setIsEditModalOpen(true);
                                }}
                                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center border border-brand-ink/20 shadow-sm text-brand-ink hover:bg-brand-ink hover:text-white transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 px-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">{art.category}</span>
                            <span className="text-[10px] font-mono text-brand-ink/30 uppercase">#{art.id.slice(0, 4)}</span>
                          </div>
                          <h4 className="text-2xl font-sans font-bold tracking-tight text-brand-ink group-hover:text-brand-red transition-colors duration-300 uppercase">{art.title}</h4>
                          <div className="h-[1px] w-full bg-brand-ink/10 my-2" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-[0.15em] text-brand-ink/40 font-medium">{art.medium || 'CANVAS PAINTING'}</span>
                            <span className="text-[10px] font-medium text-brand-ink/40">{art.year}</span>
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
          </motion.section>
        )}

        {currentView === 'exhibitions' && (
          <motion.section 
            key="exhibitions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-32 px-6 md:px-12 relative z-10 min-h-screen flex flex-col items-center justify-center"
          >
            <button 
              onClick={() => setCurrentView('home')}
              className="absolute top-32 left-6 md:left-12 flex items-center gap-2 text-xs uppercase tracking-widest text-brand-red hover:gap-4 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <h2 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter text-brand-ink uppercase mb-4">
              {sections['exhibitions']?.title || 'Exhibitions'}
            </h2>
            <p className="text-xl md:text-2xl font-light tracking-[0.5em] text-brand-red uppercase">
              {sections['exhibitions']?.content || 'Coming Soon'}
            </p>
            {isAdmin && (
              <button 
                onClick={() => {
                  setSectionToEdit(sections['exhibitions'] || { id: 'exhibitions', title: 'Exhibitions', content: 'Coming Soon', updatedAt: null });
                  setIsEditSectionModalOpen(true);
                }}
                className="mt-12 flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-ink/40 hover:text-brand-red transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit Section
              </button>
            )}
          </motion.section>
        )}

        {currentView === 'about' && (
          <motion.section 
            key="about"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-32 px-6 md:px-12 relative z-10 min-h-screen flex flex-col items-center justify-center"
          >
            <button 
              onClick={() => setCurrentView('home')}
              className="absolute top-32 left-6 md:left-12 flex items-center gap-2 text-xs uppercase tracking-widest text-brand-red hover:gap-4 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <h2 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter text-brand-ink uppercase mb-4">
              {sections['about']?.title || 'Nitya Patel'}
            </h2>
            <p className="text-xl md:text-2xl font-light tracking-[0.5em] text-brand-red uppercase">
              {sections['about']?.content || 'Coming Soon'}
            </p>
            {isAdmin && (
              <button 
                onClick={() => {
                  setSectionToEdit(sections['about'] || { id: 'about', title: 'Nitya Patel', content: 'Coming Soon', updatedAt: null });
                  setIsEditSectionModalOpen(true);
                }}
                className="mt-12 flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-ink/40 hover:text-brand-red transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit Section
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-32 px-6 bg-brand-ink text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-24">
            <div className="space-y-12">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-7xl md:text-9xl font-serif italic tracking-tighter text-white"
              >
                Nitya's Art
              </motion.h2>
              <div className="max-w-md">
                <p className="text-sm text-white/40 leading-relaxed uppercase tracking-widest">
                  A digital sanctuary for fine art and traditional craftsmanship. Curating excellence since 2024.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h5 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Connect</h5>
                <ul className="space-y-4 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  <li><a href="mailto:hello@nityasart.com" className="hover:text-brand-red transition-colors">Email Us</a></li>
                  <li><a href="#" className="hover:text-brand-red transition-colors">Newsletter</a></li>
                  <li><a href="#" className="hover:text-brand-red transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[9px] tracking-[0.5em] uppercase text-white/20">© 2024 NITYA'S ART GALLERY • ALL RIGHTS RESERVED</p>
            
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-medium">
                Developed by <span className="text-white/90 font-bold tracking-[0.4em]">JP DEVELOPER</span>
              </p>
            </div>
            
            <div className="flex gap-8 text-[9px] uppercase tracking-[0.3em] text-white/30">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
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

      {/* Edit Artwork Modal */}
      <AnimatePresence>
        {isEditModalOpen && artworkToEdit && (
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
                <h2 className="text-2xl font-light tracking-widest uppercase text-brand-red">Edit Artwork</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-white/40 hover:text-brand-red transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditArt} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Title</label>
                  <input 
                    required
                    type="text"
                    value={artworkToEdit.title}
                    onChange={e => setArtworkToEdit(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors text-white placeholder:text-white/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Category</label>
                    <select 
                      value={artworkToEdit.category}
                      onChange={e => setArtworkToEdit(prev => prev ? ({ ...prev, category: e.target.value as any }) : null)}
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
                      value={artworkToEdit.year}
                      onChange={e => setArtworkToEdit(prev => prev ? ({ ...prev, year: e.target.value }) : null)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Description</label>
                  <textarea 
                    value={artworkToEdit.description}
                    onChange={e => setArtworkToEdit(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors h-32 resize-none text-white placeholder:text-white/40"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-red text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-lg hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                >
                  Save Changes
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Section Modal */}
      <AnimatePresence>
        {isEditSectionModalOpen && sectionToEdit && (
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
                <h2 className="text-2xl font-light tracking-widest uppercase text-brand-red">Edit {sectionToEdit.id} Section</h2>
                <button onClick={() => setIsEditSectionModalOpen(false)} className="text-white/40 hover:text-brand-red transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditSection} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Title</label>
                  <input 
                    required
                    type="text"
                    value={sectionToEdit.title}
                    onChange={e => setSectionToEdit(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Subtitle (Optional)</label>
                  <input 
                    type="text"
                    value={sectionToEdit.subtitle || ''}
                    onChange={e => setSectionToEdit(prev => prev ? ({ ...prev, subtitle: e.target.value }) : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/80">Content</label>
                  <textarea 
                    required
                    value={sectionToEdit.content}
                    onChange={e => setSectionToEdit(prev => prev ? ({ ...prev, content: e.target.value }) : null)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-red/60 transition-colors h-64 resize-none text-white placeholder:text-white/40"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-brand-red text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-lg hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20"
                >
                  Save Section
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
                      <div className="flex flex-wrap gap-4 pt-4">
                        <button className="flex-1 py-4 bg-brand-red text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-full hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20">
                          Inquire About Piece
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              setArtworkToEdit(selectedArtwork);
                              setIsEditModalOpen(true);
                            }}
                            className="p-4 border-2 border-brand-ink/10 rounded-full hover:border-brand-ink hover:bg-brand-ink hover:text-white transition-all text-brand-ink"
                            title="Edit Artwork"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-brand-cream/95 backdrop-blur-xl flex flex-col p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-xl font-serif font-bold tracking-tighter text-brand-ink">NITYA'S ART</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors text-brand-ink"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex flex-col gap-8 items-start">
                {isAdmin && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => {
                      setIsAddModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-6 py-3 bg-brand-red text-white rounded-full shadow-lg shadow-brand-red/20 mb-4"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Add New Artwork</span>
                  </motion.button>
                )}

                {['Gallery', 'Exhibitions', 'About', 'Contact'].map((item, i) => (
                  <motion.button
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                      setCurrentView(item.toLowerCase() as any);
                      setIsMenuOpen(false);
                    }}
                    className="text-4xl md:text-6xl font-serif font-bold tracking-tighter text-brand-ink hover:text-brand-red transition-colors text-left"
                  >
                    {item.toUpperCase()}
                  </motion.button>
                ))}
                
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => {
                    handleShare();
                    setIsMenuOpen(false);
                  }}
                  className="text-4xl md:text-6xl font-serif font-bold tracking-tighter text-brand-ink hover:text-brand-red transition-colors text-left"
                >
                  SHARE
                </motion.button>

                {user ? (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-brand-ink/40 hover:text-brand-red transition-colors mt-8"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-bold">Logout</span>
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => {
                      handleLogin();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-brand-ink/40 hover:text-brand-red transition-colors mt-8"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-bold">Admin Login</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={shareData.title} 
        url={shareData.url} 
      />

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
