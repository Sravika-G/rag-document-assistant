import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { Layout, LogOut, FileText, Upload, Trash2, MessageSquare, Plus, ChevronRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { fetchWithAuth } from "@/src/lib/api";

// --- Components ---

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
            <Sparkles size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">RAG Assistant</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">{user.email}</span>
          <button 
            onClick={logout}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
            title="Logout"
            id="logout-btn"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}

// --- Pages ---

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Sign in to manage your documents</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              id="login-email"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              id="login-password"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={14} /> {error}</div>}
          <button 
            type="submit" 
            disabled={loading}
            id="login-submit-btn"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account? <Link to="/signup" className="text-blue-400 font-semibold hover:underline">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 text-sm">Start your AI document journey</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              id="signup-email"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              required
              id="signup-password"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={14} /> {error}</div>}
          <button 
            type="submit" 
            disabled={loading}
            id="signup-submit-btn"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Get Started"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account? <Link to="/login" className="text-blue-400 font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetchWithAuth('/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth('/documents/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process document');
      }
      fetchDocs();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred during upload');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const deleteDoc = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    try {
      await fetchWithAuth(`/documents/${id}`, { method: 'DELETE' });
      fetchDocs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">My Library</h1>
          <p className="text-slate-400 font-medium">Analyze and query your research papers & documents</p>
        </div>
        <label className={cn(
          "bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-500 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/20",
          uploading && "opacity-50 pointer-events-none"
        )}>
          {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          {uploading ? "Analyzing..." : "Upload New Document"}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-8 flex items-center gap-3"
        >
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-xs hover:underline">Dismiss</button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border-2 border-dashed border-white/10 rounded-[32px] p-16 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-500 ring-1 ring-white/10">
            <FileText size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No documents found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Upload a PDF document to begin extracting insights and chatting with our AI assistant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              layoutId={String(doc.id)}
              onClick={() => navigate(`/document/${doc.id}`)}
              className="group bg-white/5 backdrop-blur-md p-8 rounded-[28px] border border-white/10 hover:border-white/20 shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-full group-hover:translate-x-0" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl ring-1 ring-blue-500/20">
                  <FileText size={28} />
                </div>
                <button 
                  onClick={(e) => deleteDoc(doc.id, e)}
                  className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  id={`del-btn-${doc.id}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-white truncate mb-2 leading-tight">{doc.name}</h3>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-6">
                {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              
              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors">Open Analysis</span>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentDetail() {
  const { id } = useNavigate() as any; // Hook usage slightly wrong here, fixing below in the component tree
  return null;
}

// Actual Detail component using useParams
import { useParams } from "react-router-dom";

function DocumentView() {
  const { id } = useParams();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');

  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    fetchDoc();
    fetchHistory();
  }, [id]);

  const handleRegenerateSummary = async () => {
    setRegenerating(true);
    setRegenError("");
    try {
      const res = await fetchWithAuth(`/documents/${id}/regenerate-summary`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gemini is busy, please try again in a moment.");
      }
      setDoc((prev: any) => ({
        ...prev,
        summary: data.summary,
        key_points: data.key_points,
        action_items: data.action_items
      }));
    } catch (err: any) {
      console.error(err);
      setRegenError(err.message || "Failed to regenerate summary.");
    } finally {
      setRegenerating(false);
    }
  };

  const fetchDoc = async () => {
    const res = await fetchWithAuth(`/documents/${id}`);
    const data = await res.json();
    setDoc(data);
    setLoading(false);
  };

  const fetchHistory = async () => {
    const res = await fetchWithAuth(`/documents/${id}/history`);
    const data = await res.json();
    setMessages(data);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || asking) return;

    const userMsg = { role: 'user', message: input, sources: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAsking(true);

    try {
      const res = await fetchWithAuth(`/documents/${id}/ask`, {
        method: 'POST',
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', message: data.answer, sources: data.sources }]);
    } catch (e) {
      console.error(e);
    } finally {
      setAsking(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
      <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-64px)] overflow-hidden flex flex-col w-full">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white">
            <Layout size={20} />
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Document analysis</span>
            <h1 className="text-xl font-bold text-white truncate max-w-md leading-tight">{doc.name}</h1>
          </div>
        </div>
        <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg shrink-0">
          <button 
            onClick={() => setActiveTab('summary')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all",
              activeTab === 'summary' ? "bg-white/10 text-white shadow-xl ring-1 ring-white/10" : "text-slate-500 hover:text-slate-300"
            )}
            id="tab-summary"
          >
            Summary
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all",
              activeTab === 'chat' ? "bg-white/10 text-white shadow-xl ring-1 ring-white/10" : "text-slate-500 hover:text-slate-300"
            )}
            id="tab-chat"
          >
            Smart Chat
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full overflow-y-auto pr-4 space-y-8 pb-12"
            >
              <section className="bg-white/5 backdrop-blur-md p-10 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold tracking-widest ring-1 ring-green-500/30">AI ANALYZED</span>
                 </div>
                <h2 className="text-sm uppercase tracking-widest font-black text-slate-500 mb-6 flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-500" />
                  Overview
                </h2>
                <p className="text-white/90 leading-relaxed text-xl font-medium tracking-tight mb-4">{doc.summary}</p>
                {(doc.summary?.includes("temporarily unavailable") || doc.summary?.includes("busy") || doc.summary?.includes("pending")) && (
                  <div className="mt-4">
                    <button
                      onClick={handleRegenerateSummary}
                      disabled={regenerating}
                      id="regenerate-summary-btn"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-600/20"
                    >
                      {regenerating ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Regenerate Summary
                        </>
                      )}
                    </button>
                    {regenError && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={14} /> {regenError}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-white/5 backdrop-blur-md p-8 rounded-[32px] border border-white/10 shadow-2xl">
                  <h2 className="text-xs uppercase tracking-[0.2em] font-black text-slate-500 mb-8">Key Insights</h2>
                  <ul className="space-y-6">
                    {doc.key_points.map((pt: string, i: number) => (
                      <li key={i} className="flex gap-5 group">
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-full shrink-0 flex items-center justify-center text-sm font-black border border-amber-500/20 group-hover:scale-110 transition-transform">
                          {i+1}
                        </div>
                        <div className="space-y-1 mt-1">
                          <p className="text-white/90 text-sm font-semibold leading-relaxed">{pt}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-white/5 backdrop-blur-md p-8 rounded-[32px] border border-white/10 shadow-2xl">
                  <h2 className="text-xs uppercase tracking-[0.2em] font-black text-slate-500 mb-8">Critical Actions</h2>
                  <div className="space-y-4">
                    {doc.action_items.map((it: string, i: number) => (
                      <div key={i} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex gap-4 hover:border-white/10 transition-all group">
                        <div className="w-6 h-6 bg-emerald-500/20 text-emerald-500 rounded flex items-center justify-center shrink-0">
                           <Layout size={12} />
                        </div>
                        <p className="text-slate-300 text-sm font-medium tracking-tight group-hover:text-white transition-colors">{it}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between px-8 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">Smart Chat Assistant</h2>
                </div>
                <span className="text-[10px] font-bold text-slate-500">GROUNDED RESPONSE</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-6 bg-white/5 rounded-[40px] text-slate-600 ring-1 ring-white/10">
                      <MessageSquare size={48} />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-white text-xl">The assistent is ready</p>
                      <p className="text-sm text-slate-500 max-w-xs">Ask specific questions about the entities, dates, or financial metrics in this document.</p>
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-5 rounded-2xl text-sm leading-relaxed font-medium md:text-base",
                      m.role === 'user' 
                        ? "bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-950/40" 
                        : "bg-white/10 text-slate-100 rounded-tl-none border border-white/10"
                    )}>
                      {m.message}
                    </div>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-4 w-full space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sources identified:</p>
                        <div className="flex flex-wrap gap-2">
                           {m.sources.map((src: string, idx: number) => (
                             <div key={idx} className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 max-w-[200px] truncate hover:bg-white/10 transition-all cursor-default">
                                {src.substring(0, 100)}...
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {asking && (
                  <div className="flex items-center gap-3 text-blue-400 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 w-fit">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-xs font-black uppercase tracking-tighter italic">Gemini is thinking...</span>
                  </div>
                ) }
              </div>

              <form onSubmit={handleAsk} className="p-6 bg-white/5 border-t border-white/10">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={input}
                    id="chat-input"
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message assistant..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm placeholder:text-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    disabled={asking}
                  />
                  <button 
                    type="submit" 
                    id="ask-btn"
                    disabled={!input.trim() || asking}
                    className="absolute right-2 p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200 font-sans relative overflow-hidden">
        {/* Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="blob -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600"></div>
          <div className="blob -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600"></div>
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/document/:id" element={<PrivateRoute><DocumentView /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
