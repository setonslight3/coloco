'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawStroke, DrawPoint, TerritoryBoundary, Challenge } from '../types/index';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  Eraser,
  Paintbrush,
  PaintBucket,
  Trash2,
  Maximize2,
  Minimize2,
  Palette,
  X,
  Check
} from 'lucide-react';

interface CanvasProps {
  strokes: DrawStroke[];
  onDrawStroke: (stroke: Omit<DrawStroke, 'id' | 'sequence'>) => void;
  onClearTerritory?: () => void;
  myTerritoryIndex?: number;
  territories: TerritoryBoundary[];
  isLocked: boolean;
  challenge: Challenge;
  teamColor: string;
}

const DEFAULT_COLORING_LINE_ART = `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="6">
  <path d="M 500 150 C 350 150 250 300 250 600 C 250 800 350 900 500 900 C 650 900 750 800 750 600 C 750 300 650 150 500 150 Z" />
  <circle cx="400" cy="400" r="80" stroke-width="8" />
  <circle cx="600" cy="400" r="80" stroke-width="8" />
  <circle cx="400" cy="400" r="30" fill="currentColor" />
  <circle cx="600" cy="400" r="30" fill="currentColor" />
  <polygon points="500,480 470,550 530,550" />
  <path d="M 300 650 Q 500 750 700 650" />
  <path d="M 350 700 Q 500 800 650 700" />
  <circle cx="500" cy="500" r="400" stroke-dasharray="20 15" stroke-width="3" />
</svg>`;

export function Canvas({
  strokes,
  onDrawStroke,
  onClearTerritory,
  myTerritoryIndex = 0,
  territories,
  isLocked,
  challenge,
  teamColor
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const colorWheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawPoint[]>([]);
  const [color, setColor] = useState('#0284c7');
  const [size, setSize] = useState(8);
  const [showReference, setShowReference] = useState(true);
  const [isReferenceMinimized, setIsReferenceMinimized] = useState(false);
  const [showTerritoryOverlay, setShowTerritoryOverlay] = useState(true);
  const [boundaryWarning, setBoundaryWarning] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modals & Panels
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isColorWheelOpen, setIsColorWheelOpen] = useState(false);
  const [wheelBrightness, setWheelBrightness] = useState(100);
  const [customHexInput, setCustomHexInput] = useState('#0284c7');

  // Curated artist palette
  const palette = [
    '#0f172a', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
    '#10b981', '#06b6d4', '#0284c7', '#6366f1', '#8b5cf6',
    '#ec4899', '#78350f'
  ];

  // Flood fill algorithm
  const performFloodFill = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      fillHex: string,
      restrictToTerritory: boolean = true
    ) => {
      const width = 1000;
      const height = 1000;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Parse fill hex to RGBA
      const parsedHex = fillHex.replace('#', '');
      const fillR = parseInt(parsedHex.substring(0, 2), 16) || 0;
      const fillG = parseInt(parsedHex.substring(2, 4), 16) || 0;
      const fillB = parseInt(parsedHex.substring(4, 6), 16) || 0;
      const fillA = 255;

      const startIndex = (startY * width + startX) * 4;
      const targetR = data[startIndex];
      const targetG = data[startIndex + 1];
      const targetB = data[startIndex + 2];
      const targetA = data[startIndex + 3];

      // If clicked color already matches fill color, skip
      if (
        Math.abs(targetR - fillR) < 12 &&
        Math.abs(targetG - fillG) < 12 &&
        Math.abs(targetB - fillB) < 12 &&
        Math.abs(targetA - fillA) < 12
      ) {
        return;
      }

      const matchTarget = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        return (
          Math.abs(r - targetR) <= 36 &&
          Math.abs(g - targetG) <= 36 &&
          Math.abs(b - targetB) <= 36 &&
          Math.abs(a - targetA) <= 36
        );
      };

      const queue: number[] = [startX, startY];
      const visited = new Uint8Array(width * height);
      visited[startY * width + startX] = 1;

      let filledCount = 0;
      const maxFillPixels = 500000; // Safety guard

      while (queue.length > 0 && filledCount < maxFillPixels) {
        const cy = queue.pop()!;
        const cx = queue.pop()!;
        const idx = (cy * width + cx) * 4;

        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;
        filledCount++;

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i][0];
          const ny = neighbors[i][1];
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const vIdx = ny * width + nx;
            if (!visited[vIdx]) {
              visited[vIdx] = 1;
              if (!restrictToTerritory || isPointInMyTerritory({ x: nx, y: ny })) {
                const nDataIdx = vIdx * 4;
                if (matchTarget(nDataIdx)) {
                  queue.push(nx, ny);
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    },
    [myTerritoryIndex, territories]
  );

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
      if (!s.points || s.points.length === 0) continue;

      if (s.tool === 'fill') {
        // Flood fill from seed point
        performFloodFill(ctx, s.points[0].x, s.points[0].y, s.color, false);
      } else {
        // Standard brush or eraser stroke
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
    }
  }, [strokes, performFloodFill]);

  useEffect(() => {
    renderStrokes();
  }, [renderStrokes]);

  // Render smooth, organic territory dividing seams
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 1000, 1000);

    if (!showTerritoryOverlay) return;

    const total = territories.length || 2;

    ctx.save();

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
        ctx.moveTo(1000, 0);
        for (let i = 0; i <= steps; i++) {
          const y = (i / steps) * 1000;
          const x = 500 + 45 * Math.sin(((y + 80) / 1000) * 2 * Math.PI * 2);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(1000, 1000);
        ctx.closePath();
      } else {
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

  // Render interactive Color Wheel
  useEffect(() => {
    if (!isColorWheelOpen) return;
    const canvas = colorWheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 4;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * width + x) * 4;

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 180; // 0..360
          const sat = dist / radius; // 0..1
          const val = wheelBrightness / 100; // 0..1

          // HSV to RGB
          const c = val * sat;
          const hPrime = angle / 60;
          const xVal = c * (1 - Math.abs((hPrime % 2) - 1));
          let r1 = 0, g1 = 0, b1 = 0;

          if (hPrime >= 0 && hPrime < 1) { r1 = c; g1 = xVal; }
          else if (hPrime >= 1 && hPrime < 2) { r1 = xVal; g1 = c; }
          else if (hPrime >= 2 && hPrime < 3) { g1 = c; b1 = xVal; }
          else if (hPrime >= 3 && hPrime < 4) { g1 = xVal; b1 = c; }
          else if (hPrime >= 4 && hPrime < 5) { r1 = xVal; b1 = c; }
          else { r1 = c; b1 = xVal; }

          const m = val - c;
          data[idx] = Math.round((r1 + m) * 255);
          data[idx + 1] = Math.round((g1 + m) * 255);
          data[idx + 2] = Math.round((b1 + m) * 255);
          data[idx + 3] = 255;
        } else {
          data[idx + 3] = 0; // Transparent outside circle
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [isColorWheelOpen, wheelBrightness]);

  const handleColorWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorWheelCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] > 10) {
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
        .toString(16)
        .slice(1)}`;
      setColor(hex);
      setCustomHexInput(hex);
      if (activeTool === 'eraser') setActiveTool('brush');
    }
  };

  // Coordinate mapping
  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): DrawPoint | null => {
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

    // Handle Paint Bucket Fill
    if (activeTool === 'fill') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          performFloodFill(ctx, pt.x, pt.y, color, true);
          onDrawStroke({
            playerId: '',
            teamId: '',
            color,
            size: 1,
            points: [pt],
            timestamp: Date.now(),
            tool: 'fill'
          });
        }
      }
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing || isLocked || activeTool === 'fill') return;
    const pt = getCanvasPoint(e);
    if (!pt) return;

    if (!isPointInMyTerritory(pt)) {
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
        ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const lastPt = currentPoints[currentPoints.length - 1];
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }

    setCurrentPoints((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || isLocked || activeTool === 'fill') return;
    setIsDrawing(false);

    // Filter points strictly inside territory
    const validPoints = currentPoints.filter((pt) => isPointInMyTerritory(pt));

    if (validPoints.length > 0) {
      onDrawStroke({
        playerId: '',
        teamId: '',
        color: activeTool === 'eraser' ? '#ffffff' : color,
        size,
        points: validPoints,
        timestamp: Date.now(),
        tool: activeTool === 'eraser' ? 'eraser' : 'brush'
      });
    }

    setCurrentPoints([]);
  };

  const handleExecuteClear = () => {
    if (onClearTerritory) {
      onClearTerritory();
    }
    setIsClearConfirmOpen(false);
  };

  const hasColoringLineArt = Boolean(
    challenge.templateLineArtSvg || challenge.mode === 'coloring'
  );
  const lineArtHtml = challenge.templateLineArtSvg || DEFAULT_COLORING_LINE_ART;

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
              type="button"
              onClick={() => setShowReference(!showReference)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-navy-800 border border-sky-200 dark:border-navy-700 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors shadow-xs"
            >
              {showReference ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showReference ? 'Hide Guide' : 'Show Guide'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTerritoryOverlay(!showTerritoryOverlay)}
            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-xs"
          >
            {showTerritoryOverlay ? 'Hide Seams' : 'Show Seams'}
          </button>

          <button
            type="button"
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

        {/* Template Line Art (Crisp, High-Contrast Coloring Mode Artwork) */}
        {hasColoringLineArt && (
          <div
            className="absolute inset-0 pointer-events-none opacity-90 text-slate-900 z-10 p-3 sm:p-5 flex items-center justify-center select-none"
            dangerouslySetInnerHTML={{ __html: lineArtHtml }}
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
                type="button"
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
                You marked your section as done. Waiting for teammates to complete their zones!
              </p>
            </div>
          </div>
        )}

        {/* Base Artboard Canvas */}
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
            isLocked
              ? 'cursor-not-allowed'
              : activeTool === 'fill'
              ? 'cursor-cell'
              : 'cursor-crosshair'
          }`}
        />
      </div>

      {/* Sleek Toolbar Controls */}
      <div className="w-full bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-2xl p-3 sm:px-4 shadow-md flex flex-wrap items-center justify-between gap-3 relative">
        {/* Color Palette Swatches & Interactive Color Wheel */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                if (activeTool === 'eraser') setActiveTool('brush');
              }}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
              className={`w-6 h-6 rounded-full transition-transform border border-slate-300 dark:border-slate-600 shadow-xs ${
                activeTool !== 'eraser' && color.toLowerCase() === c.toLowerCase()
                  ? 'scale-125 ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-navy-900'
                  : 'hover:scale-110 active:scale-95'
              }`}
            />
          ))}

          {/* Interactive Color Wheel Launcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsColorWheelOpen(!isColorWheelOpen)}
              className="w-7 h-7 rounded-full p-0.5 border-2 border-slate-300 dark:border-slate-600 shadow-xs flex items-center justify-center hover:scale-110 transition-transform active:scale-95 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500"
              title="Open Color Wheel & Custom Colors"
              aria-label="Open Color Wheel"
            >
              <div
                className="w-full h-full rounded-full border border-white/80"
                style={{ backgroundColor: activeTool === 'eraser' ? '#ffffff' : color }}
              />
            </button>

            {/* Custom Color Wheel Popover */}
            {isColorWheelOpen && (
              <div className="absolute bottom-10 left-0 z-50 p-4 bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-3xl shadow-2xl w-64 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-500" /> Color Wheel
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsColorWheelOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Canvas Hue/Sat Wheel */}
                <div className="flex justify-center">
                  <canvas
                    ref={colorWheelCanvasRef}
                    width={160}
                    height={160}
                    onClick={handleColorWheelClick}
                    className="cursor-crosshair rounded-full shadow-inner border border-slate-200 dark:border-navy-700"
                  />
                </div>

                {/* Brightness / Lightness slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Brightness</span>
                    <span>{wheelBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={wheelBrightness}
                    onChange={(e) => setWheelBrightness(parseInt(e.target.value, 10))}
                    className="w-full accent-sky-500 h-1.5 bg-slate-200 dark:bg-navy-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Live Preview & Hex Input */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl border border-slate-300 dark:border-navy-600 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="text"
                    value={customHexInput}
                    onChange={(e) => {
                      setCustomHexInput(e.target.value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        setColor(e.target.value);
                      }
                    }}
                    placeholder="#0284c7"
                    className="flex-1 px-2.5 py-1 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white"
                  />
                  {/* Native fallback color input button */}
                  <div className="relative w-7 h-7 rounded-xl overflow-hidden border border-slate-300 dark:border-navy-600 flex-shrink-0 cursor-pointer" title="Native System Picker">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        setCustomHexInput(e.target.value);
                      }}
                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsColorWheelOpen(false)}
                  className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Apply Color
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Brush Controls, Eraser, Fill Tool & Clear Canvas */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Brush Size Slider with Live Preview Dot (visible in brush/eraser) */}
          {activeTool !== 'fill' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-navy-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700">
              <div className="w-5 h-5 flex items-center justify-center">
                <span
                  className="rounded-full bg-slate-700 dark:bg-slate-200 transition-all duration-75"
                  style={{
                    width: `${Math.max(4, Math.min(20, size * 0.7))}px`,
                    height: `${Math.max(4, Math.min(20, size * 0.7))}px`,
                    backgroundColor: activeTool === 'eraser' ? '#f43f5e' : color
                  }}
                />
              </div>
              <input
                type="range"
                min={2}
                max={32}
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value, 10))}
                className="w-14 sm:w-20 accent-sky-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 w-3">
                {size}
              </span>
            </div>
          )}

          {/* 1. Brush Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('brush')}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              activeTool === 'brush'
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-100'
            }`}
            title="Brush Tool"
          >
            <Paintbrush className="w-4 h-4" />
          </button>

          {/* 2. Paint Bucket Fill Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('fill')}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              activeTool === 'fill'
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-100'
            }`}
            title="Paint Bucket / Fill Tool"
          >
            <PaintBucket className="w-4 h-4" />
          </button>

          {/* 3. Eraser Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              activeTool === 'eraser'
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-100'
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* 4. Clear Canvas Button (With Confirmation Modal) */}
          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="p-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
            title="Clear Your Side of the Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear All Confirmation Modal Pop-up */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Clear Your Canvas?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to clear all your drawings on your side of the canvas? This cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-md transition-colors"
              >
                Yes, Clear Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
