/**
 * Waiting Room / Game Page
 * 
 * Combined page that shows:
 * - Waiting room before game starts
 * - Simon game board during gameplay
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSimonStore } from '../store/simonStore';
import { socketService } from '../services/socketService';
import { soundService } from '../services/soundService';
import { CircularSimonBoard } from '../components/game/CircularSimonBoard';
import { GameOverScreen } from '../components/game/GameOverScreen';
import { Toast } from '../components/ui/Toast';
import { MuteButton } from '../components/ui/MuteButton';

export function WaitingRoomPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useAuthStore();
  const gameCode = session?.gameCode;
  const playerId = session?.playerId;
  
  const { 
    isGameActive, 
    currentSequence, 
    currentRound, 
    isShowingSequence,
    isInputPhase,
    playerSequence,
    canSubmit,
    lastResult,
    message,
    secondsRemaining,
    timerColor,
    isTimerPulsing,
    isEliminated,
    scores,
    submittedPlayers,
    isGameOver,
    gameWinner,
    finalScores,
    initializeListeners,
    cleanup,
    addColorToSequence,
    submitSequence,
    resetGame,
  } = useSimonStore();
  
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'active'>('waiting');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(session?.isHost || false);
  const [players, setPlayers] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const lastCountdownValue = useRef<number | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    console.log('🎮 WaitingRoomPage mounted');
    
    // CRITICAL FIX: Connect socket FIRST, then initialize listeners
    const socket = socketService.connect();
    console.log('✅ Socket connected:', socket.connected);
    
    // Initialize Simon listeners AFTER socket is connected
    initializeListeners();
    
    // Join room via socket
    if (gameCode && playerId) {
      socket.emit('join_room_socket', { gameCode, playerId });
    }
    
    // Listen for initial room state (ONCE to avoid race condition)
    socket.once('room_state', (room: any) => {
      console.log('📦 Initial room state:', room);
      setPlayers(room.players || []);
      setRoomStatus(room.status);
      
      // Check if we're the host
      const me = room.players?.find((p: any) => p.id === playerId);
      const isHostPlayer = me?.isHost || false;
      console.log('🎮 isHost check:', { playerId, me, isHostPlayer });
      setIsHost(isHostPlayer);
    });
    
    // Listen for room state updates (when players join/leave)
    socket.on('room_state_update', (room: any) => {
      console.log('🔄 Room state updated:', room);
      setPlayers(room.players || []);
      setRoomStatus(room.status);
      
      // Check if we're the host
      const me = room.players?.find((p: any) => p.id === playerId);
      setIsHost(me?.isHost || false);
    });
    
    // Listen for errors
    socket.on('error', (data: { message: string }) => {
      console.error('❌ Server error:', data.message);
      setToast({ message: data.message, type: 'error' });
    });
    
    // Listen for countdown
    socket.on('countdown', (data: { count: number }) => {
      console.log('⏳ Countdown:', data.count);
      setRoomStatus('countdown');
      setCountdownValue(data.count);
      
      // 🔊 Play countdown beep (only once per second)
      if (lastCountdownValue.current !== data.count) {
        soundService.playCountdown(data.count);
        lastCountdownValue.current = data.count;
      }
      
      if (data.count === 0) {
        setRoomStatus('active');
        setCountdownValue(null);
        lastCountdownValue.current = null;
      }
    });
    
    // Listen for player joined (for real-time feedback)
    socket.on('player_joined', (player: any) => {
      console.log('👋 Player joined:', player);
      // Don't modify state here - wait for room_state_update
    });
    
    // Listen for player left
    socket.on('player_left', (data: { playerId: string }) => {
      console.log('👋 Player left:', data.playerId);
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });
    
    // Listen for game restarted (Play Again)
    socket.on('game_restarted', (data: { gameCode: string }) => {
      console.log('🔄 Game restarted:', data.gameCode);
      // Reset local state to waiting room
      resetGame();
      setRoomStatus('waiting');
      lastCountdownValue.current = null;
    });
    
    // Cleanup on unmount
    return () => {
      cleanup();
      socket.off('room_state');
      socket.off('room_state_update');
      socket.off('error');
      socket.off('countdown');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_restarted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode, playerId]); // Removed initializeListeners & cleanup - they're stable
  
  // Handle start game (host only)
  const handleStartGame = async () => {
    console.log('🎮 DEBUG: handleStartGame called');
    console.log('🎮 DEBUG: gameCode:', gameCode);
    console.log('🎮 DEBUG: playerId:', playerId);
    console.log('🎮 DEBUG: isHost:', isHost);
    
    // 🔊 Initialize sound on user interaction
    await soundService.init();
    
    const socket = socketService.getSocket();
    console.log('🎮 DEBUG: socket exists:', !!socket);
    console.log('🎮 DEBUG: socket connected:', socket?.connected);
    
    if (!socket) {
      console.error('❌ No socket connection');
      setToast({ message: 'No connection to server', type: 'error' });
      return;
    }
    
    if (!gameCode || !playerId) {
      console.error('❌ Missing gameCode or playerId');
      setToast({ message: 'Missing game info', type: 'error' });
      return;
    }
    
    console.log('📤 Emitting start_game:', { gameCode, playerId });
    socket.emit('start_game', { gameCode, playerId });
  };
  
  // Copy game code to clipboard
  const copyGameCode = async () => {
    if (!gameCode) return;
    
    try {
      await navigator.clipboard.writeText(gameCode);
      setToast({ message: 'Game code copied!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to copy code', type: 'error' });
    }
  };
  
  // Copy invite link to clipboard
  const copyInviteLink = async () => {
    if (!gameCode) return;
    
    const inviteUrl = `${window.location.origin}/?join=${gameCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setToast({ message: 'Invite link copied!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to copy link', type: 'error' });
    }
  };
  
  // Handle Play Again
  const handlePlayAgain = () => {
    // Reset local game state
    resetGame();
    setRoomStatus('waiting');
    
    // Emit restart_game to reset room on server
    const socket = socketService.getSocket();
    if (socket && gameCode && playerId) {
      console.log('🔄 Restarting game:', { gameCode, playerId });
      socket.emit('restart_game', { gameCode, playerId });
    }
  };

  // Handle Go Home
  const handleGoHome = () => {
    cleanup();
    clearSession();
    navigate('/');
  };

  // Share game using native share API (mobile-friendly)
  const shareGame = async () => {
    if (!gameCode) return;
    
    const inviteUrl = `${window.location.origin}/?join=${gameCode}`;
    
    // Check if native share is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Simon Game!',
          text: `Join me in Simon Says! Use code: ${gameCode}`,
          url: inviteUrl,
        });
        setToast({ message: 'Invite shared!', type: 'success' });
      } catch (err) {
        // User cancelled or error - fallback to copy
        if ((err as Error).name !== 'AbortError') {
          copyInviteLink();
        }
      }
    } else {
      // Fallback to copy for desktop
      copyInviteLink();
    }
  };
  
  // Render Game Over screen
  if (isGameOver) {
    return (
      <>
        <MuteButton />
        <GameOverScreen
          winner={gameWinner}
          finalScores={finalScores}
          currentPlayerId={playerId || ''}
          roundsPlayed={currentRound}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          gameCode={gameCode || ''}
        />
      </>
    );
  }

  // Render game board if active
  if (roomStatus === 'active' && isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-2 relative overflow-hidden w-full">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-900/20 via-primary-900/20 to-accent-900/20"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        {/* Mute Button */}
        <MuteButton />
        
        {/* Exit Button */}
        <button
          onClick={handleGoHome}
          className="fixed top-4 left-4 z-50 w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-white/30 backdrop-premium text-white font-semibold transition-premium shadow-large hover:shadow-glow active:scale-95 flex items-center justify-center group"
          style={{ touchAction: 'manipulation' }}
          aria-label="Exit game"
          title="Exit to home"
        >
          <span className="text-xl group-hover:rotate-90 transition-transform">✕</span>
        </button>
        
        <div className="flex flex-col items-center w-full relative z-10 px-4">
          {/* Step 4: Scoreboard */}
          {isGameActive && Object.keys(scores).length > 0 && (
            <div className="glass-dark rounded-2xl p-4 mb-4 w-full border border-white/10 shadow-large">
              <h3 className="text-white/90 font-bold text-sm mb-3 uppercase tracking-wider">Leaderboard</h3>
              <div className="space-y-2">
                {players.map((player) => {
                  const score = scores[player.id] || 0;
                  const hasSubmitted = submittedPlayers.includes(player.id);
                  const isCurrentPlayer = player.id === playerId;
                  
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        isCurrentPlayer 
                          ? 'bg-gradient-to-r from-primary-500/30 to-accent-500/30 border-2 border-primary-400/50 shadow-glow' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{player.avatar}</span>
                        <span className="text-white font-semibold text-sm sm:text-base">
                          {player.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {hasSubmitted && isInputPhase && (
                          <span className="text-emerald-400 text-lg font-bold">✓</span>
                        )}
                        <span className={`text-sm sm:text-base font-bold ${
                          isCurrentPlayer ? 'text-white' : 'text-white/80'
                        }`}>
                          {score} <span className="text-xs font-normal">pts</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Step 4: Eliminated Message */}
          {isEliminated && (
            <div className="glass-dark border-2 border-red-500/50 rounded-2xl p-6 mb-4 text-center w-full bg-red-500/10 shadow-large">
              <div className="text-5xl mb-3">💀</div>
              <div className="text-white text-xl font-bold mb-1">Eliminated!</div>
              <div className="text-white/70 text-sm">Better luck next round</div>
            </div>
          )}
          
          <CircularSimonBoard
            sequence={currentSequence}
            round={currentRound}
            isShowingSequence={isShowingSequence}
            isInputPhase={isInputPhase}
            playerSequence={playerSequence}
            canSubmit={canSubmit}
            lastResult={lastResult}
            onColorClick={addColorToSequence}
            onSubmit={() => {
              if (gameCode && playerId) {
                submitSequence(gameCode, playerId);
              }
            }}
            disabled={isEliminated}
            secondsRemaining={secondsRemaining}
            timerColor={timerColor}
            isTimerPulsing={isTimerPulsing}
          />
          
          {/* Message Display */}
          <div className="mt-6 text-center">
            <p className="text-white text-lg sm:text-xl font-semibold drop-shadow-lg">{message}</p>
          </div>
          
          {/* Players Status */}
          <div className="mt-8 glass-dark rounded-2xl p-5 border border-white/10">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Players</h3>
            <div className="grid grid-cols-2 gap-3">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <span className="text-lg">{player.avatar}</span>
                  <span className="truncate">{player.displayName}</span>
                  {player.isHost && <span className="text-yellow-400">👑</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render countdown
  if (roomStatus === 'countdown' && countdownValue !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 flex items-center justify-center p-4 relative overflow-hidden w-full">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        <div className="text-center relative z-10 w-full px-4">
          <div className="inline-block">
            <h1 className="text-8xl font-bold text-white mb-6 drop-shadow-2xl animate-scale-in" style={{ textShadow: '0 0 40px rgba(255,255,255,0.5)' }}>
              {countdownValue}
            </h1>
          </div>
          <p className="text-2xl text-white font-semibold animate-fade-in">Get ready!</p>
        </div>
      </div>
    );
  }
  
  // Render waiting room
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-accent-600 to-primary-700 flex items-center justify-center p-4 relative overflow-hidden w-full">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="glass rounded-3xl shadow-large p-6 w-full relative z-10 animate-scale-in max-w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Waiting Room</h1>
          <p className="text-slate-600 text-sm font-medium">Players are joining...</p>
        </div>
        
        {/* Game Code Display with Share Buttons */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-6 mb-4 border-2 border-accent-200">
            <p className="text-center text-slate-600 mb-2 text-sm font-medium">Game Code</p>
            <p className="text-center font-mono font-bold text-3xl sm:text-4xl text-accent-700 tracking-wider mb-4">
              {gameCode}
            </p>
            
            {/* Invite Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={copyGameCode}
                className="btn-premium-secondary text-sm py-3 px-6"
                style={{ touchAction: 'manipulation' }}
                title="Copy game code"
              >
                <span>📋</span>
                <span className="hidden sm:inline">Copy Code</span>
                <span className="sm:hidden">Code</span>
              </button>
              
              <button
                onClick={copyInviteLink}
                className="btn-premium-secondary text-sm py-3 px-6"
                style={{ touchAction: 'manipulation' }}
                title="Copy invite link"
              >
                <span>🔗</span>
                <span className="hidden sm:inline">Copy Link</span>
                <span className="sm:hidden">Link</span>
              </button>
              
              <button
                onClick={shareGame}
                className="btn-premium-gradient from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-sm py-3 px-6"
                style={{ touchAction: 'manipulation' }}
                title="Share with friends"
              >
                <span>📤</span>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Players List */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>Players</span>
            <span className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm font-semibold">
              {players.length}
            </span>
          </h2>
          <div className="space-y-3">
            {players.map(player => (
              <div 
                key={player.id} 
                className={`bg-white rounded-xl p-4 flex items-center justify-between shadow-soft hover:shadow-medium transition-all ${
                  player.id === playerId ? 'ring-2 ring-accent-500 bg-accent-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{player.avatar}</span>
                  <span className="font-semibold text-slate-900">
                    {player.displayName}
                    {player.id === playerId && <span className="ml-2 text-sm text-slate-500 font-normal">(You)</span>}
                  </span>
                </div>
                {player.isHost && (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    👑 Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Start Button (host only, or solo player) */}
        {(isHost || players.length === 1) && (
          <>
            {players.length === 1 && (
              <p className="text-center text-sm text-slate-500 mb-4 font-medium">
                💡 You can start solo or wait for others to join
              </p>
            )}
            <button
              onClick={handleStartGame}
              className="btn-premium-gradient from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg"
              style={{ touchAction: 'manipulation' }}
            >
              <span>🎮</span>
              <span>{players.length === 1 ? 'Start Solo Game' : 'Start Game'}</span>
            </button>
          </>
        )}
        
        {!isHost && players.length > 1 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-slate-600 font-medium">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Waiting for host to start the game...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
