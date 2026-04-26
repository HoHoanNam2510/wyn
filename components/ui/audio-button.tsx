'use client';

import { useState, useRef } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AudioButton({ url, label }: { url: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function toggle() {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    setLoading(true);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setLoading(false);
      setPlaying(false);
    };
    await audio.play().catch(() => {});
    setLoading(false);
    setPlaying(true);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={toggle}
      aria-label={label ?? 'Phát âm'}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Volume2 className={`h-3.5 w-3.5 ${playing ? 'text-primary' : ''}`} />
      )}
    </Button>
  );
}
