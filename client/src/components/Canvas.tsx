'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawStroke, DrawPoint, TerritoryBoundary, Challenge } from '../types/index';
import { ShieldAlert, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface CanvasProps {
  strokes: DrawStroke[];
  onDrawStroke: (stroke: Omit<DrawStroke, 'id' | 'sequence'>) => void;
  myTerritoryIndex?: number;
  territories: TerritoryBoundary[];
  isLocked: boolean; // True if player clicked DONE or time is 0
  challenge: Challenge;
  teamColor: string;
}

export function Canvas({
  strokes,
  onDrawStroke,
  myTerritoryIndex,
  territories,
  isLocked,
  challenge,
  teamColor
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawPoint[]>([]);
  const [color, setColor] = useState('#0284c7');
  const [size, setSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [showTerritoryOverlay, setShowTerritoryOverlay] = useState(true);
  const [territoryAlert, setTerritoryAlert] = useState<string | null>(null);

  // Palette colors
  const palette = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#0284c7', '#6366f1', '#a855f7', '#ec4899', '#78350f'
  ];

  // Draw all existing strokes onto canvas
  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas to white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 1000);

    for (const s of strokes) {
      if (s.points.length === 0) continue;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    renderStrokes();
  }, [renderStrokes]);

  // Render Territory boundaries on the overlay canvas
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 1000, 1000);

    if (!showTerritoryOverlay || territories.length === 0) return;

    territories.forEach((t) => {
      const isMine = t.playerIndex === myTerritoryIndex;
      ctx.save();

      ctx.beginPath();
      if (t.points.length > 0) {
        ctx.moveTo(t.points[0].x, t.points[0].y);
        for (let i = 1; i < t.points.length; i++) {
          ctx.lineTo(t.points[i].x, t.points[i].y);
        }
        ctx.closePath();
      }

      // Shading outside my territory to clearly guide player
      if (!isMine) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
        ctx.fill();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 6]);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [territories, myTerritoryIndex, showTerritoryOverlay]);

  // Helper: map event coordinates to 0..1000 space
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): DrawPoint | null => {
    const canvas = overlayRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = 1000 / rect.width;
    const scaleY = 1000 / rect.height;

    const x = Math.round((clientX - rect.left) * scaleX);
    const y = Math.round((clientY - rect.top) * scaleY);

    return { x: Math.max(0, Math.min(1000, x)), y: Math.max(0, Math.min(1000, y)) };
  };

  const handlePointerDown = (e: any) => {
    if (isLocked) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    setIsDrawing(true);
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing || isLocked) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    // Draw dynamically on canvas for real-time responsiveness
    const canvas = canvasRef.current;
    if (canvas && currentPoints.length > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = isEraser ? '#ffffff' : color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const lastPt = currentPoints[currentPoints.length - 1];
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }

    setCurrentPoints(prev => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || isLocked) return;
    setIsDrawing(false);

    if (currentPoints.length > 0) {
      onDrawStroke({
        playerId: '',
        teamId: '',
        color: isEraser ? '#ffffff' : color,
        size,
        points: currentPoints,
        timestamp: Date.now()
      });
    }

    setCurrentPoints([]);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* Top Banner: Mode & Reference */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-sky-50 dark:bg-navy-800 border border-sky-200 dark:border-navy-700 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-sky-500 text-white">
            {challenge.mode}
          </span>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {challenge.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {challenge.mode === 'drawing' && challenge.referenceImageUrl && (
            <button
              onClick={() => setShowReference(!showReference)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-navy-700 border border-sky-300 dark:border-navy-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50 shadow-sm"
            >
              {showReference ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showReference ? 'Hide Reference' : 'Show Reference'}
            </button>
          )}

          <button
            onClick={() => setShowTerritoryOverlay(!showTerritoryOverlay)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-navy-700 border border-sky-300 dark:border-navy-600 text-slate-600 dark:text-slate-300 shadow-sm"
          >
            {showTerritoryOverlay ? 'Hide Boundaries' : 'Show Boundaries'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-[650px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-300 dark:border-navy-700 bg-white">
        {/* Template Line-Art (if in coloring mode) */}
        {challenge.mode === 'coloring' && challenge.templateLineArtSvg && (
          <div
            className="absolute inset-0 pointer-events-none opacity-30 text-slate-700 dark:text-slate-900 z-10"
            dangerouslySetInnerHTML={{ __html: challenge.templateLineArtSvg }}
          />
        )}

        {/* Floating Drawing Reference Window */}
        {challenge.mode === 'drawing' && challenge.referenceImageUrl && showReference && (
          <div className="absolute top-3 right-3 z-30 w-36 h-36 rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-navy-600 pointer-events-auto group">
            <img
              src={challenge.referenceImageUrl}
              alt="Reference Guide"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white text-center py-0.5">
              Reference
            </div>
          </div>
        )}

        {/* Lock Overlay when territory is locked */}
        {isLocked && (
          <div className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4">
            <div className="bg-navy-900/90 border border-sky-400 px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-coloco-lightBlue animate-pulse" />
              <span className="font-bold text-lg">Territory Locked</span>
              <p className="text-xs text-sky-200 text-center max-w-xs">
                You marked DONE. Your territory is locked while teammates finish.
              </p>
            </div>
          </div>
        )}

        {/* Background Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Interactive Pointer Overlay Canvas */}
        <canvas
          ref={overlayRef}
          width={1000}
          height={1000}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className={`absolute inset-0 w-full h-full object-contain ${
            isLocked ? 'cursor-not-allowed' : 'cursor-crosshair'
          }`}
        />
      </div>

      {/* Toolbar Controls */}
      <div className="w-full max-w-2xl bg-white dark:bg-navy-800 border border-sky-200 dark:border-navy-700 rounded-2xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Color Palette */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {palette.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full transition-transform border border-slate-300 dark:border-slate-600 shadow-sm ${
                !isEraser && color === c ? 'scale-125 ring-2 ring-sky-500 ring-offset-2' : 'hover:scale-110'
              }`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsEraser(false);
            }}
            className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
          />
        </div>

        {/* Brush Controls & Eraser */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Size</span>
            <input
              type="range"
              min={2}
              max={36}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-4">{size}</span>
          </div>

          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isEraser
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : 'bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-600'
            }`}
          >
            {isEraser ? 'Eraser Active' : 'Eraser'}
          </button>
        </div>
      </div>
    </div>
  );
}
