import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PATModal from './components/ui/PATModal';
import HelpModal from './components/ui/HelpModal';
import { Github, ArrowRight, ShieldCheck, Zap, GitCommit, HelpCircle } from 'lucide-react';
import { checkAuth } from './services/github';

const Landing = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!url) return;

    // Basic validation
    if (!url.includes('github.com') || !url.includes('/pull/')) {
      setError('Please enter a valid GitHub PR URL');
      return;
    }

    const savedToken = localStorage.getItem('partial_merger_pat');
    if (!savedToken) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      // Validate token quickly
      await checkAuth(savedToken);
      navigate('/dashboard', { state: { url, token: savedToken } });
    } catch (e) {
      // Token invalid or expired
      localStorage.removeItem('partial_merger_pat');
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async (token) => {
    setLoading(true);
    try {
      await checkAuth(token);
      localStorage.setItem('partial_merger_pat', token);
      setShowModal(false);
      handleAnalyze(); // Retry analysis
    } catch (e) {
      alert("Invalid Token. Please check capabilities.");
    } finally {
      setLoading(false);
    }
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden font-sans text-white selection:bg-primary/30">

      {/* Cursor Glow */}
      <div
        className="fixed w-[100px] h-[100px] bg-gradient-to-r from-blue-600/50 to-cyan-400/50 rounded-full blur-[40px] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out will-change-transform z-0"
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-glow">
            <GitCommit className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">PartialMerger</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            <HelpCircle size={18} />
            How to use
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 text-center pb-32">


        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 flex flex-col items-center gap-1">
          <span className="font-display leading-none">Ship only</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 leading-tight pb-2">
            what's ready.
          </span>
        </h1>



        {/* Input Area */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-surface border border-white/10 rounded-full p-2 pl-6 shadow-2xl">
            <Github className="text-zinc-500 mr-4" size={24} />
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              placeholder="Paste GitHub PR Link"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-500 text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2 shadow-glow"
            >
              {loading ? 'Analyzing...' : <>Analyze <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 mt-4 text-sm animate-in slide-in-from-top-2">{error}</p>}



      </main>

      <PATModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveToken}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
