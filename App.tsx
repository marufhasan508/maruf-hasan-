
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Settings, AlertCircle, ChevronLeft, 
  User as UserIcon, LogOut, TrendingUp, Trophy 
} from 'lucide-react';
import { AppState, User, Mistake, SpeechAnalysis } from './types';
import Robot from './components/Robot';
import { analyzeSpeech } from './services/geminiService';

// Constants
const INITIAL_POINTS = 1000;
const POINT_GAIN = 10;
const POINT_LOSS = 10;

// --- Components ---

const LoginPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const handleMockLogin = () => {
    // Simulate Google Login
    const mockUser: User = {
      name: "Alex Johnson",
      email: "alex.j@example.com",
      photo: "https://picsum.photos/seed/alex/100/100"
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass rounded-3xl p-10 shadow-xl"
      >
        <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-200">
          <TrendingUp className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lumina</h1>
        <p className="text-gray-500 mb-10">Your personal AI English speaking coach. Practice anytime, anywhere.</p>
        
        <button
          onClick={handleMockLogin}
          className="w-full bg-white border border-gray-200 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-gray-700 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
          Sign in with Google
        </button>
        
        <p className="mt-8 text-xs text-gray-400">
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

const HomePage: React.FC<{
  state: AppState;
  onUpdatePoints: (delta: number) => void;
  onAddMistake: (mistake: Mistake) => void;
  onLogout: () => void;
}> = ({ state, onUpdatePoints, onAddMistake, onLogout }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleVoiceInput(text);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        setIsProcessing(false);
      };
    }
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setFeedback(null);
    
    const analysis: SpeechAnalysis = await analyzeSpeech(text);
    
    if (analysis.status === 'correct') {
      onUpdatePoints(POINT_GAIN);
      setFeedback("+10 Perfect English!");
    } else {
      onUpdatePoints(-POINT_LOSS);
      const newMistake: Mistake = {
        id: Date.now().toString(),
        original: text,
        corrected: analysis.correction || text,
        reason: analysis.feedback || (analysis.status === 'wrong_language' ? 'Language detected: Bengali' : 'Grammar error'),
        pointsDeducted: POINT_LOSS,
        timestamp: Date.now()
      };
      onAddMistake(newMistake);
      setFeedback(`-10 ${analysis.status === 'wrong_language' ? 'Try English only' : 'Small mistake'}`);
    }

    speak(analysis.reply);
    setIsProcessing(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setFeedback(null);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 max-w-lg mx-auto w-full relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <Link to="/mistakes" className="p-3 glass rounded-2xl text-gray-600 hover:bg-white transition-colors relative">
          <AlertCircle size={24} />
          {state.mistakes.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {state.mistakes.length}
            </span>
          )}
        </Link>

        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
          <Trophy className="text-yellow-500" size={20} />
          <span className="font-bold text-gray-800 text-lg">{state.points}</span>
        </div>

        <button onClick={onLogout} className="p-3 glass rounded-2xl text-gray-600 hover:bg-white transition-colors">
          <LogOut size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <Robot isListening={isRecording} isSpeaking={isSpeaking} />
        
        <div className="text-center h-20 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.p 
                key="listening"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-blue-500 font-medium animate-pulse"
              >
                Listening...
              </motion.p>
            ) : isProcessing ? (
              <motion.p 
                key="processing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-indigo-500 font-medium"
              >
                Thinking...
              </motion.p>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Hello, I'm Lumina</h2>
                <p className="text-gray-500">Tap the mic to start speaking</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback Bubble */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`px-4 py-2 rounded-full font-bold text-white shadow-lg ${
                feedback.startsWith('+') ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {transcript && !isRecording && (
          <div className="glass p-4 rounded-2xl max-w-xs text-center text-sm text-gray-600 italic">
            "{transcript}"
          </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="pb-10 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            isRecording 
              ? 'bg-red-500 shadow-red-200' 
              : 'bg-blue-600 shadow-blue-200'
          }`}
        >
          {isRecording ? (
            <MicOff className="text-white" size={32} />
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </motion.button>
      </div>
    </div>
  );
};

const MistakesPage: React.FC<{ mistakes: Mistake[] }> = ({ mistakes }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto w-full">
      <header className="p-6 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Learning Journey</h1>
      </header>

      <main className="flex-1 p-6 space-y-4">
        {mistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Trophy size={32} />
            </div>
            <p>No mistakes yet! Keep speaking perfectly.</p>
          </div>
        ) : (
          [...mistakes].reverse().map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                  -{m.pointsDeducted} Points
                </span>
                <span className="text-[10px] text-gray-400">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">What you said</p>
                  <p className="text-gray-700 font-medium italic">"{m.original}"</p>
                </div>
                
                <div className="pl-4 border-l-2 border-blue-500">
                  <p className="text-xs uppercase tracking-wider text-blue-500 font-bold mb-1">Correction</p>
                  <p className="text-gray-800 font-semibold">{m.corrected}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-sm text-gray-600">
                  <span className="font-bold mr-1">Coach Note:</span> {m.reason}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto w-full">
      <header className="p-6 flex items-center gap-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
      </header>
      <div className="p-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
           <div className="p-4 flex items-center justify-between border-b border-gray-50">
             <span className="text-gray-700">Daily Goal</span>
             <span className="text-blue-600 font-bold">30 mins</span>
           </div>
           <div className="p-4 flex items-center justify-between border-b border-gray-50">
             <span className="text-gray-700">Voice Gender</span>
             <span className="text-gray-500">Female</span>
           </div>
           <div className="p-4 flex items-center justify-between">
             <span className="text-gray-700">Notifications</span>
             <div className="w-10 h-5 bg-blue-600 rounded-full relative">
               <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

// --- App Container ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('lumina_state');
    if (saved) return JSON.parse(saved);
    return {
      points: INITIAL_POINTS,
      mistakes: [],
      user: null,
      isAuthenticated: false
    };
  });

  useEffect(() => {
    localStorage.setItem('lumina_state', JSON.stringify(state));
  }, [state]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, user, isAuthenticated: true }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: null, isAuthenticated: false }));
  };

  const updatePoints = (delta: number) => {
    setState(prev => ({ ...prev, points: prev.points + delta }));
  };

  const addMistake = (mistake: Mistake) => {
    setState(prev => ({ ...prev, mistakes: [...prev.mistakes, mistake] }));
  };

  return (
    <Router>
      <div className="min-h-screen gradient-bg">
        <Routes>
          {!state.isAuthenticated ? (
            <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
          ) : (
            <>
              <Route path="/" element={
                <HomePage 
                  state={state} 
                  onUpdatePoints={updatePoints} 
                  onAddMistake={addMistake}
                  onLogout={handleLogout}
                />
              } />
              <Route path="/mistakes" element={<MistakesPage mistakes={state.mistakes} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
