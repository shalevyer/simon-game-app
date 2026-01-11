/**
 * Game Over Screen Component
 * 
 * Displays the end game results with:
 * - Winner celebration with crown
 * - Final scoreboard with medals
 * - Game stats
 * - Play Again / Home buttons
 * - Share score functionality
 */

import { useEffect, useState } from 'react';
import { soundService } from '../../services/soundService';

// =============================================================================
// TYPES
// =============================================================================

interface GameOverScreenProps {
  winner: {
    playerId: string;
    name: string;
    score: number;
  } | null;
  finalScores: Array<{
    playerId: string;
    name: string;
    score: number;
    isEliminated?: boolean;
  }>;
  currentPlayerId: string;
  roundsPlayed: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  gameCode: string;
}

// =============================================================================
// CONFETTI COMPONENT
// =============================================================================

const Confetti: React.FC = () => {
  const colors = ['#ff4136', '#ffdc00', '#2ecc40', '#0074d9', '#ff6b6b', '#ffd93d'];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-fall"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
};

// =============================================================================
// GAME OVER SCREEN COMPONENT
// =============================================================================

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  winner,
  finalScores,
  currentPlayerId,
  roundsPlayed,
  onPlayAgain,
  onGoHome,
  gameCode,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const isWinner = winner?.playerId === currentPlayerId;
  const isSoloGame = finalScores.length === 1;

  // Animate score count-up
  useEffect(() => {
    if (!winner) return;
    
    const targetScore = winner.score;
    const duration = 1500; // 1.5 seconds
    const steps = 30;
    const increment = targetScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [winner]);

  // Play victory sound on mount
  useEffect(() => {
    soundService.playVictory();
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Get medal emoji based on rank
  const getMedal = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  // Share score functionality
  const handleShare = async () => {
    const myScore = finalScores.find(s => s.playerId === currentPlayerId)?.score || 0;
    const rank = finalScores.findIndex(s => s.playerId === currentPlayerId) + 1;
    
    const shareText = isSoloGame
      ? `🎮 I reached Round ${roundsPlayed} in Shalev Says with ${myScore} points! Can you beat my score?`
      : `🏆 I finished #${rank} in Shalev Says with ${myScore} points! ${isWinner ? '👑 WINNER!' : ''}`;
    
    const shareUrl = `${window.location.origin}/?join=${gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shalev Says Score',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - fallback to copy
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText + '\n' + shareUrl);
        }
      }
    } else {
      copyToClipboard(shareText + '\n' + shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-900/30 via-primary-900/30 to-accent-900/30"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Confetti */}
      {showConfetti && <Confetti />}
      
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Game Over Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
            Game Over
          </h1>
          <div className="text-4xl">🎉</div>
        </div>

        {/* Winner Section */}
        {winner && (
          <div className="glass-dark border-2 border-yellow-400/50 rounded-3xl p-8 mb-6 text-center relative overflow-hidden bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-glow-lg">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-yellow-400/10 animate-pulse-slow" />
            
            <div className="relative z-10">
              {/* Crown animation */}
              <div className="text-6xl mb-4 animate-bounce drop-shadow-lg">👑</div>
              
              <h2 className="text-3xl font-bold text-yellow-300 mb-3 drop-shadow-lg">
                {isSoloGame ? 'Great Job!' : 'Winner!'}
              </h2>
              
              <div className="text-white text-2xl font-bold mb-3">
                {winner.name}
              </div>
              
              <div className="inline-flex items-baseline gap-2 bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
                <span className="text-5xl font-bold text-yellow-300">
                  {animatedScore}
                </span>
                <span className="text-lg text-white/80 font-medium">points</span>
              </div>
              
              {isWinner && !isSoloGame && (
                <div className="mt-4 text-emerald-300 text-sm font-bold bg-emerald-500/20 px-4 py-2 rounded-full inline-block">
                  ✨ That's YOU! ✨
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scoreboard (Multiplayer only) */}
        {!isSoloGame && finalScores.length > 0 && (
          <div className="glass-dark rounded-2xl p-5 mb-6 border border-white/10 shadow-large">
            <h3 className="text-white font-bold text-center mb-4 text-sm uppercase tracking-wider">
              Final Standings
            </h3>
            
            <div className="space-y-3">
              {finalScores.map((player, index) => {
                const isCurrentPlayer = player.playerId === currentPlayerId;
                const rank = index + 1;
                
                return (
                  <div
                    key={player.playerId}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                      isCurrentPlayer
                        ? 'bg-gradient-to-r from-primary-500/30 to-accent-500/30 border-2 border-primary-400/50 shadow-glow scale-105'
                        : rank <= 3
                          ? 'bg-white/10 border border-white/20'
                          : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl w-10 text-center">
                        {getMedal(rank)}
                      </span>
                      <span className="text-white font-semibold">
                        {player.name}
                        {isCurrentPlayer && <span className="text-xs ml-2 text-primary-300 font-normal">(you)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {player.isEliminated && (
                        <span className="text-red-400 text-lg">💀</span>
                      )}
                      <span className="text-white font-bold text-sm">
                        {player.score} <span className="text-xs font-normal text-white/70">pts</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Stats */}
        <div className="glass-dark rounded-2xl p-6 mb-6 border border-white/10 shadow-large">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">{roundsPlayed}</div>
              <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Rounds</div>
            </div>
            <div className="border-l border-white/20" />
            <div>
              <div className="text-3xl font-bold text-white mb-1">
                {finalScores.find(s => s.playerId === currentPlayerId)?.score || 0}
              </div>
              <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Your Score</div>
            </div>
            {!isSoloGame && (
              <>
                <div className="border-l border-white/20" />
                <div>
                  <div className="text-3xl font-bold text-white mb-1">
                    #{finalScores.findIndex(s => s.playerId === currentPlayerId) + 1}
                  </div>
                  <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Your Rank</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          {/* Play Again Button */}
          <button
            onClick={onPlayAgain}
            className="btn-premium-gradient from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold"
            style={{ touchAction: 'manipulation' }}
          >
            <span>🔄</span>
            <span>Play Again</span>
          </button>

          {/* Home Button */}
          <button
            onClick={onGoHome}
            className="btn-premium-glass text-white font-semibold"
            style={{ touchAction: 'manipulation' }}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="btn-premium-gradient from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3"
            style={{ touchAction: 'manipulation' }}
          >
            <span>📤</span>
            <span>Share Score</span>
          </button>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GameOverScreen;
