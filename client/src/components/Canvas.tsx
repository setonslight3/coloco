'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawStroke, DrawPoint, TerritoryBoundary, Challenge } from '../types/index';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  Eraser,
  Paintbrush,
  Sparkles,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface CanvasProps {
  strokes: DrawStroke[];
  onDrawStroke: (stroke: Omit<DrawStroke, 'id' | 'sequence'>) => void;
  myTerritoryIndex?: number;
  territories: TerritoryBoundary[];
  isLocked: boolean;
  challenge: Challenge;
  teamColor: string;
}

export function Canvas({
  strokes,
  onDrawStroke,
  myTerritoryIndex = 0,
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
  const [isReferenceMinimized, setIsReferenceMinimized] = useState(false);
  const [showTerritoryOverlay, setShowTerritoryOverlay] = useState(true);
  const [boundaryWarning, setBoundaryWarning] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Curated artist palette
  const palette = [
    '#0f172a', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#0284c7', '#6366f1', '#8b5cf6',
    '#ec4899', '#78350f'
  ];

  // Render all committed strokes
  const renderStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pristine white artboard
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

  // Render smooth, organic territory dividing seams (avoiding awkward polygon borders)
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 1000, 1000);

    if (!showTerritoryOverlay) return;

    const total = territories.length || 2;

    ctx.save();

    // 1. Draw elegant dividing seam curves
    if (total === 2) {
      ctx.beginPath();
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * 1000;
        const x = 500 + 45 * Math.sin(((y + 80) / 1000) * 2 * Math.PI * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Divider Seam Stroke
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 6]);
      ctx.stroke();

      // Soft shade on the non-active side
      ctx.beginPath();
      if (myTerritoryIndex === 0) {
        // Player is on Left (0..divider). Shade Right side.
        ctx.moveTo(1000, 0);
        for (let i = 0; i <= steps; i++) {
          const y = (i / steps) * 1000;
          const x = 500 + 45 * Math.sin(((y + 80) / 1000) * 2 * Math.PI * 2);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(1000, 1000);
        ctx.closePath();
      } else {
        // Player is on Right (divider..1000). Shade Left side.
        ctx.moveTo(0, 0);
        for (let i = 0; i <= steps; i++) {
          const y = (i / steps) * 1000;
          const x = 500 + 45 * Math.sin(((y + 80) / 1000) * 2 * Math.PI * 2);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(0, 1000);
        ctx.closePath();
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
      ctx.fill();
    } else if (total === 3) {
      // 3 vertical wavy divisions
      const steps = 60;
      for (const divBase of [333, 667]) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const y = (i / steps) * 1000;
          const x = divBase + 35 * Math.sin((y / 1000) * 2 * Math.PI * 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.7)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([10, 6]);
        ctx.stroke();
      }
    } else if (total >= 4) {
      // 4 quadrants with smooth wavy lines at x=500 and y=500
      ctx.beginPath();
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const y = (i / steps) * 1000;
        const x = 500 + 35 * Math.sin((y / 1000) * 1.5 * Math.PI * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 6]);
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * 1000;
        const y = 500 + 35 * Math.cos((x / 1000) * 1.5 * Math.PI * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(2, 132, 199, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 6]);
      ctx.stroke();
    }

    ctx.restore();
  }, [territories, myTerritoryIndex, showTerritoryOverlay]);

  // Coordinate mapping
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

  // Boundary checker on client
  const isPointInMyTerritory = (pt: DrawPoint): boolean => {
    const total = territories.length || 2;
    if (total <= 1) return true;

    if (total === 2) {
      const dividerX = 500 + 45 * Math.sin(((pt.y + 80) / 1000) * 2 * Math.PI * 2);
      if (myTerritoryIndex === 0) return pt.x <= dividerX;
      if (myTerritoryIndex === 1) return pt.x > dividerX;
      return false;
    }

    if (total === 3) {
      const div1 = 333 + 35 * Math.sin(((pt.y + 40) / 1000) * 2 * Math.PI * 2);
      const div2 = 667 + 35 * Math.sin(((pt.y + 180) / 1000) * 2 * Math.PI * 2);
      if (myTerritoryIndex === 0) return pt.x <= div1;
      if (myTerritoryIndex === 1) return pt.x > div1 && pt.x <= div2;
      if (myTerritoryIndex === 2) return pt.x > div2;
      return false;
    }

    // 4 quadrants
    const midX = 500 + 35 * Math.sin(((pt.y + 50) / 1000) * 1.5 * Math.PI * 2);
    const midY = 500 + 35 * Math.cos(((pt.x + 70) / 1000) * 1.5 * Math.PI * 2);
    const isLeft = pt.x <= midX;
    const isTop = pt.y <= midY;
    if (myTerritoryIndex === 0) return isLeft && isTop;
    if (myTerritoryIndex === 1) return !isLeft && isTop;
    if (myTerritoryIndex === 2) return isLeft && !isTop;
    if (myTerritoryIndex === 3) return !isLeft && !isTop;
    return true;
  };

  const handlePointerDown = (e: any) => {
    if (isLocked) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    if (!isPointInMyTerritory(pt)) {
      setBoundaryWarning('Blocked: You cannot draw in your teammate or opponent territory!');
      setTimeout(() => setBoundaryWarning(null), 2500);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing || isLocked) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    if (!isPointInMyTerritory(pt)) {
      // Stroke reached boundary - do not paint outside assigned territory
      setBoundaryWarning('Boundary reached: Drawing stays inside your territory.');
      setTimeout(() => setBoundaryWarning(null), 2000);
      return;
    }

    // Fast local rendering during active gesture
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

    // Filter points strictly inside territory
    const validPoints = currentPoints.filter(pt => isPointInMyTerritory(pt));

    if (validPoints.length > 0) {
      onDrawStroke({
        playerId: '',
        teamId: '',
        color: isEraser ? '#ffffff' : color,
        size,
        points: validPoints,
        timestamp: Date.now()
      });
    }

    setCurrentPoints([]);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none max-w-2xl mx-auto">
      {/* Top Banner: Mode Details & Controls */}
      <div className="w-full flex items-center justify-between bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-2xl p-3 sm:px-4 shadow-sm gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-sky-500 text-white flex-shrink-0">
            {challenge.mode}
          </span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
              {challenge.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {challenge.mode === 'drawing' && challenge.referenceImageUrl && (
            <button
              onClick={() => setShowReference(!showReference)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-navy-800 border border-sky-200 dark:border-navy-700 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors shadow-xs"
            >
              {showReference ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showReference ? 'Hide Guide' : 'Show Guide'}</span>
            </button>
          )}

          <button
            onClick={() => setShowTerritoryOverlay(!showTerritoryOverlay)}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-xs"
          >
            {showTerritoryOverlay ? 'Hide Seams' : 'Show Seams'}
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-300 hover:bg-sky-100 transition-colors shadow-xs"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Canvas'}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullScreen ? 'Minimize' : 'Full Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main Artboard Canvas Container */}
      <div
        className={`relative aspect-square overflow-hidden shadow-2xl border-2 sm:border-4 border-slate-200 dark:border-navy-700 bg-white transition-all duration-300 ${
          isFullScreen
            ? 'fixed inset-2 sm:inset-6 z-50 m-auto max-h-[92vh] max-w-[92vh] w-full rounded-3xl ring-9999 ring-navy-950/80 shadow-2xl'
            : 'w-full max-w-[560px] rounded-2xl sm:rounded-3xl'
        }`}
      >
        {/* Fullscreen Floating Controls Bar */}
        {isFullScreen && (
          <div className="absolute top-3 right-3 z-50 flex items-center gap-2 bg-navy-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-sky-400/40 text-white shadow-xl">
            <span className="text-[11px] font-bold text-sky-300">Full Screen</span>
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="p-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors"
              title="Exit Full Screen"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Boundary Toast Warning */}
        {boundaryWarning && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-rose-500 text-white text-xs font-black shadow-xl animate-fadeIn flex items-center gap-2 max-w-[90%] text-center">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{boundaryWarning}</span>
          </div>
        )}

        {/* Subtle Territory Zone Pill Indicator */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <div className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border border-sky-200 dark:border-navy-700 text-sky-600 dark:text-sky-300 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>Zone #{myTerritoryIndex + 1} (Your Territory)</span>
          </div>
        </div>

        {/* Template Line Art (Coloring Mode) */}
        {challenge.mode === 'coloring' && challenge.templateLineArtSvg && (
          <div
            className="absolute inset-0 pointer-events-none opacity-25 text-slate-800 dark:text-slate-900 z-10 p-4"
            dangerouslySetInnerHTML={{ __html: challenge.templateLineArtSvg }}
          />
        )}

        {/* Floating Reference Guide (Drawing Mode) */}
        {challenge.mode === 'drawing' && challenge.referenceImageUrl && showReference && (
          <div
            className={`absolute top-3 right-3 z-30 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-navy-700 transition-all duration-200 ${
              isReferenceMinimized ? 'w-24 h-10' : 'w-36 sm:w-44 aspect-square'
            }`}
          >
            <div className="flex items-center justify-between px-2 py-1 bg-slate-100 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              <span>Reference</span>
              <button
                onClick={() => setIsReferenceMinimized(!isReferenceMinimized)}
                className="hover:text-sky-500 p-0.5"
              >
                {isReferenceMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
            {!isReferenceMinimized && (
              <img
                src={challenge.referenceImageUrl}
                alt="Drawing Reference"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Locked Territory Banner */}
        {isLocked && (
          <div className="absolute inset-0 z-40 bg-navy-950/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-4 animate-fadeIn">
            <div className="bg-white dark:bg-navy-900 border border-emerald-400 dark:border-emerald-500 px-6 py-5 rounded-3xl shadow-2xl flex flex-col items-center gap-2 max-w-xs text-center">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <span className="font-black text-lg text-slate-900 dark:text-white">
                Territory Finished
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your section is locked. Cheering on teammates until time expires!
              </p>
            </div>
          </div>
        )}

        {/* Background Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        />

        {/* Pointer Overlay Canvas with touch-none */}
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
          style={{ touchAction: 'none' }}
          className={`absolute inset-0 w-full h-full object-contain select-none ${
            isLocked ? 'cursor-not-allowed' : 'cursor-crosshair'
          }`}
        />
      </div>

      {/* Sleek Toolbar Controls */}
      <div className="w-full bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-2xl p-3 sm:px-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Color Palette Swatches */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {palette.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsEraser(false);
              }}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
              className={`w-6 h-6 rounded-full transition-transform border border-slate-300 dark:border-slate-600 shadow-xs ${
                !isEraser && color === c
                  ? 'scale-125 ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-navy-900'
                  : 'hover:scale-110 active:scale-95'
              }`}
            />
          ))}

          {/* Native HTML5 Color Wheel Input */}
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 shadow-xs flex-shrink-0 cursor-pointer">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setIsEraser(false);
              }}
              title="Custom Color"
              className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-0 p-0"
            />
          </div>
        </div>

        {/* Brush Controls & Tool Toggles */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Brush Size Slider with Live Preview Dot */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-navy-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700">
            {/* Visual Dot Preview */}
            <div className="w-5 h-5 flex items-center justify-center">
              <span
                className="rounded-full bg-slate-700 dark:bg-slate-200 transition-all duration-75"
                style={{
                  width: `${Math.max(4, Math.min(20, size * 0.7))}px`,
                  height: `${Math.max(4, Math.min(20, size * 0.7))}px`,
                  backgroundColor: isEraser ? '#f43f5e' : color
                }}
              />
            </div>
            <input
              type="range"
              min={2}
              max={32}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              className="w-16 sm:w-20 accent-sky-500 cursor-pointer"
            />
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 w-3">
              {size}
            </span>
          </div>

          {/* Brush vs Eraser Toggle */}
          <button
            onClick={() => setIsEraser(false)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              !isEraser
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
            }`}
            title="Brush Tool"
          >
            <Paintbrush className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsEraser(true)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              isEraser
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
