/**
 * Entry Page
 * 
 * Name + avatar selection page.
 * First screen players see.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, joinGame } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function EntryPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [avatarId, setAvatarId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setSession } = useAuthStore();
  const navigate = useNavigate();
  
  // Handle invite link with game code in URL
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setMode('join');
      setGameCode(joinCode.toUpperCase());
    }
  }, [searchParams]);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await createSession(displayName, avatarId);
      setSession(response.session);
      navigate('/waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(false);

    try {
      const response = await joinGame(displayName, avatarId, gameCode);
      setSession(response.session);
      navigate('/waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 flex items-center justify-center p-6 relative overflow-hidden w-full">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="glass rounded-3xl shadow-large p-10 w-full relative z-10 animate-scale-in max-w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-glow mb-6">
              <span className="text-4xl">🎮</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 tracking-tight">Shalev Says</h1>
            <p className="text-slate-600 text-base font-medium">Memory Challenge Game</p>
          </div>
          
          <div className="flex flex-col items-center gap-6 pt-4">
            <button
              onClick={() => setMode('create')}
              className="btn-premium-gradient from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 text-white font-semibold text-lg group"
              style={{ touchAction: 'manipulation' }}
            >
              <span>Create Game</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            
            <button
              onClick={() => setMode('join')}
              className="btn-premium-secondary font-semibold text-lg group"
              style={{ touchAction: 'manipulation' }}
            >
              <span>Join Game</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 flex items-center justify-center p-6 relative overflow-hidden w-full">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="glass rounded-3xl shadow-large p-10 w-full relative z-10 animate-scale-in max-w-full">
        <button
          onClick={() => setMode(null)}
          className="text-slate-600 hover:text-slate-900 active:text-slate-900 mb-8 text-sm font-medium flex items-center gap-2 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back</span>
        </button>
        
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {mode === 'create' ? 'Create Game' : 'Join Game'}
          </h2>
          <p className="text-slate-600 text-sm">
            {mode === 'create' ? 'Start a new game session' : 'Enter a game code to join'}
          </p>
        </div>
        
        <form onSubmit={mode === 'create' ? handleCreateGame : handleJoinGame} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              minLength={3}
              maxLength={12}
              required
              className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-premium shadow-soft hover:shadow-medium"
            />
          </div>
          
          {mode === 'join' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Game Code
                {searchParams.get('join') && (
                  <span className="ml-2 text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-md">
                    Pre-filled
                  </span>
                )}
              </label>
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                maxLength={6}
                required
                className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 uppercase text-base font-semibold tracking-widest transition-premium shadow-soft hover:shadow-medium"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">
              Choose Avatar
            </label>
            <div className="grid grid-cols-4 gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatarId(id)}
                  className={`p-4 rounded-2xl border-2 transition-premium min-h-[64px] min-w-[64px] flex items-center justify-center ${
                    avatarId === id
                      ? 'border-accent-500 bg-gradient-to-br from-accent-50 to-primary-50 shadow-medium scale-105 ring-2 ring-accent-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-soft hover:shadow-medium'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="text-3xl">{['😀', '🎮', '🚀', '⚡', '🎨', '🎯', '🏆', '🌟'][parseInt(id) - 1]}</span>
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium shadow-soft">
              {error}
            </div>
          )}
          
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="btn-premium-gradient from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold text-lg disabled:shadow-none"
              style={{ touchAction: 'manipulation' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'create' ? 'Create Game' : 'Join Game'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
