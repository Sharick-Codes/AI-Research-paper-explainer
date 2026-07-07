import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Chrome, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider,
  updateProfile,
  auth,
  sendPasswordResetEmail
} from '../firebase';

interface AuthPagesProps {
  initialView?: 'login' | 'register';
  onSuccess: () => void;
  onBackToHome: () => void;
}

export default function AuthPages({ initialView = 'login', onSuccess, onBackToHome }: AuthPagesProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  // Registration password strength indicator states
  const [passStrength, setPassStrength] = useState(0);
  const [passFeedback, setPassFeedback] = useState('');
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  useEffect(() => {
    // Remember me check
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    // Password strength evaluator
    if (view !== 'register' || !password) {
      setPassStrength(0);
      setPassFeedback('');
      return;
    }

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setPassStrength(score);

    if (score <= 2) {
      setPassFeedback('Weak');
    } else if (score <= 4) {
      setPassFeedback('Medium');
    } else {
      setPassFeedback('Strong');
    }
  }, [password, view]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error("Google authentication error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The Google sign-in window was closed before completing authentication. If you are using the embedded preview, please open the app in a new window/tab using the preview URL, or use standard Email and Password login.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Google sign-in was cancelled or interrupted. Please try again or use standard Email and Password login.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up windows are blocked by your browser. Please enable pop-ups, open the app in a new window/tab, or sign in with Email and Password instead.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in your Firebase Console. To enable Google Sign-In:\n1. Go to your Firebase Console.\n2. Navigate to Build > Authentication > Sign-in method.\n3. Click "Add new provider", select "Google", enable it, configure project details/email, and save.\nIn the meantime, you can sign in using standard Email and Password instead.');
      } else {
        setError((err.message || 'Failed to authenticate with Google.') + ' Consider signing in with standard Email and Password instead.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        
        onSuccess();
      } else if (view === 'register') {
        if (!name.trim()) {
          setError('Name is required for registration.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (credential.user) {
          await updateProfile(credential.user, { displayName: name });
        }
        
        setInfoMessage('Account created successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in your Firebase Console. To enable it:\n1. Go to your Firebase Console.\n2. Navigate to Build > Authentication > Sign-in method.\n3. Click "Add new provider" and select "Email/Password" -> click Enable and Save.\nIn the meantime, you can sign in instantly using your Google Account below!');
      } else {
        setError(err.message || 'An authentication error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage('Password reset link sent to your email.');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is not enabled in your Firebase Console. Please enable "Email/Password" in your Firebase project (under Authentication > Sign-in method) to use password recovery.');
      } else {
        setError(err.message || 'Failed to send password reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Visual Ambient Backgrounds */}
      <div className="absolute top-[-200px] left-[-200px] w-96 h-96 bg-indigo-650/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-96 h-96 bg-indigo-550/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Back button */}
      <button 
        onClick={onBackToHome}
        className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium py-2 px-3 rounded-xl bg-slate-900 border border-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      <div className="w-full max-w-md relative">
        {/* APP LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20 mb-3">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Paper<span className="text-indigo-400">Explainer</span>
          </h2>
          <p className="text-xs text-slate-450 mt-1">Get instant multi-angle AI explanations for PDFs</p>
        </div>

        {/* AUTH CARD */}
        <motion.div 
          layout
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
        >
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-200 text-sm mb-6 whitespace-pre-line leading-relaxed">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-center space-x-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-200 text-sm mb-6">
              <CheckCircle className="h-5 w-5 text-indigo-400 flex-shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleEmailAuth} className="space-y-5">
              <h3 className="text-xl font-bold text-white mb-2">Welcome Back</h3>
              <p className="text-xs text-slate-450">Enter your credentials to access your academic library.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500" 
                      placeholder="you@university.edu"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider">Password</label>
                    <button 
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500" 
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 h-4 w-4"
                  />
                  <span className="text-xs text-slate-455 select-none">Remember email</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Logging in...' : 'Sign In'}</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-3 text-slate-500">Or continue with</span></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-slate-955 hover:bg-slate-800 border border-slate-800 rounded-2xl text-sm font-semibold text-white transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <Chrome className="h-5 w-5 text-red-500" />
                <span>Google Account</span>
              </button>

              {isInIframe && (
                <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
                  💡 <strong>Iframe Mode:</strong> If Google sign-in fails or blocks popups, please use <strong>Email & Password</strong> or open the app in a <strong>New Tab</strong> using the URL above.
                </p>
              )}

              <p className="text-center text-xs text-slate-450 mt-6">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setView('register'); setError(null); }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Create account
                </button>
              </p>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleEmailAuth} className="space-y-5">
              <h3 className="text-xl font-bold text-white mb-2">Create Academic Account</h3>
              <p className="text-xs text-slate-450">Get 20+ precise perspectives, quizzes, and live AI chat features.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500" 
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500" 
                      placeholder="you@university.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-955 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500" 
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password strength visualizer */}
                  {password && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-450">
                        <span>PASSWORD STRENGTH</span>
                        <span className={`
                          ${passFeedback === 'Weak' ? 'text-rose-400' : ''}
                          ${passFeedback === 'Medium' ? 'text-amber-400' : ''}
                          ${passFeedback === 'Strong' ? 'text-indigo-400' : ''}
                        `}>
                          {passFeedback.toUpperCase()}
                        </span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden flex space-x-0.5">
                        <div className={`h-full flex-1 rounded-l-full ${passStrength >= 1 ? (passStrength <= 2 ? 'bg-rose-500' : passStrength <= 4 ? 'bg-amber-500' : 'bg-indigo-500') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 ${passStrength >= 3 ? (passStrength <= 4 ? 'bg-amber-500' : 'bg-indigo-500') : 'bg-transparent'}`} />
                        <div className={`h-full flex-1 rounded-r-full ${passStrength >= 5 ? 'bg-indigo-500' : 'bg-transparent'}`} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2 mt-6"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-3 text-slate-500">Or continue with</span></div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-slate-955 hover:bg-slate-800 border border-slate-800 rounded-2xl text-sm font-semibold text-white transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <Chrome className="h-5 w-5 text-red-500" />
                <span>Google Account</span>
              </button>

              {isInIframe && (
                <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
                  💡 <strong>Iframe Mode:</strong> If Google sign-up fails or blocks popups, please use <strong>Email & Password</strong> or open the app in a <strong>New Tab</strong> using the URL above.
                </p>
              )}

              <p className="text-center text-xs text-slate-450 mt-6">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setView('login'); setError(null); }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-2">
                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to login</span>
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
              <p className="text-xs text-slate-450">Enter your email and we'll send a link to securely recover your account.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500" 
                    placeholder="you@university.edu"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Sending link...' : 'Send Recovery Link'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
