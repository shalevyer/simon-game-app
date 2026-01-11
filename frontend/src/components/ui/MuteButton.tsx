/**
 * Mute Button Component
 * 
 * Toggle button for muting/unmuting game sounds.
 * Persists preference in localStorage.
 */

import { useState, useEffect } from 'react';
import { soundService } from '../../services/soundService';

export const MuteButton: React.FC = () => {
  const [isMuted, setIsMuted] = useState(soundService.getMuted());

  // Sync with sound service on mount
  useEffect(() => {
    setIsMuted(soundService.getMuted());
  }, []);

  const handleToggle = () => {
    const newMuted = soundService.toggleMute();
    setIsMuted(newMuted);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        fixed top-6 right-6 z-50
        w-14 h-14 rounded-2xl
        flex items-center justify-center
        transition-premium
        backdrop-premium
        ${isMuted 
          ? 'bg-slate-700/80 hover:bg-slate-600/80 border-2 border-slate-600' 
          : 'bg-emerald-500/80 hover:bg-emerald-400/80 border-2 border-emerald-400'}
        shadow-large hover:shadow-glow
        active:scale-95
        group
      `}
      style={{ touchAction: 'manipulation' }}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      title={isMuted ? 'Click to unmute' : 'Click to mute'}
    >
      <span className={`text-2xl transition-transform group-active:scale-110 ${isMuted ? 'opacity-70' : ''}`}>
        {isMuted ? '🔇' : '🔊'}
      </span>
    </button>
  );
};

export default MuteButton;
