import React, { useEffect, useRef } from "react";
import { audioEngine } from "../utils/audioEngine";

interface AudioWaveformVisualizerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  accentColor?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isPlaying,
  currentTime,
  duration,
  onSeek,
  accentColor = "#6366f1",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let bars = 64;
    const analyser = audioEngine.getAnalyser();
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
      ctx.fillRect(0, 0, width, height);

      if (analyser && dataArray && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      const barWidth = width / bars;
      const progressRatio = duration > 0 ? currentTime / duration : 0;
      const playedBars = Math.floor(bars * progressRatio);

      for (let i = 0; i < bars; i++) {
        let barHeight = 8;
        if (isPlaying && dataArray) {
          const index = Math.floor((i / bars) * (dataArray.length * 0.7));
          const val = dataArray[index] || 0;
          barHeight = Math.max(6, (val / 255) * (height - 12));
        } else {
          // Static harmonic contour
          const sinWave = Math.sin((i / bars) * Math.PI * 4);
          const cosWave = Math.cos((i / bars) * Math.PI * 2);
          barHeight = 10 + Math.abs(sinWave * 14 + cosWave * 10);
        }

        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        const isPlayed = i <= playedBars;
        if (isPlayed) {
          ctx.fillStyle = accentColor;
        } else {
          ctx.fillStyle = "rgba(100, 116, 139, 0.35)";
        }

        // Rounded bar
        const r = 2;
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y, Math.max(1, barWidth - 3), barHeight, r);
        ctx.fill();
      }

      // Draw playhead cursor
      if (duration > 0) {
        const cursorX = width * progressRatio;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(cursorX - 1, 4, 2, height - 8);
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, accentColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="relative w-full h-16 group cursor-pointer select-none">
      <canvas
        ref={canvasRef}
        width={720}
        height={64}
        onClick={handleCanvasClick}
        className="w-full h-full rounded-lg bg-[#0d1322] border border-slate-800/80 transition-colors group-hover:border-slate-700"
      />
      {/* Timecode overlay */}
      <div className="absolute right-2 bottom-1 px-1.5 py-0.5 text-[10px] font-mono tracking-wider text-slate-400 bg-slate-900/80 rounded border border-slate-800 pointer-events-none">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return "00:00";
  const mins = Math.floor(sec / 60);
  const remainingSecs = Math.floor(sec % 60);
  return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
}
