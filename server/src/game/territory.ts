import { DrawPoint, TerritoryBoundary } from '../types/index.js';

/**
 * Irregular/wavy territory boundary generation and point containment verification.
 * Coordinates are normalized to a 1000x1000 grid.
 */

export function getWavyDividerX(y: number, baseY: number = 0, amplitude: number = 45, frequency: number = 2.5): number {
  return amplitude * Math.sin(((y + baseY) / 1000) * frequency * Math.PI * 2);
}

export function getWavyDividerY(x: number, baseX: number = 0, amplitude: number = 45, frequency: number = 2.5): number {
  return amplitude * Math.cos(((x + baseX) / 1000) * frequency * Math.PI * 2);
}

/**
 * Checks if a given point (0..1000, 0..1000) falls within the assigned territory for playerIndex.
 */
export function isPointInTerritory(
  point: DrawPoint,
  playerIndex: number,
  totalPlayers: number
): boolean {
  const { x, y } = point;
  // Out of canvas bounds
  if (x < 0 || x > 1000 || y < 0 || y > 1000) return false;

  if (totalPlayers <= 1) return true;

  if (totalPlayers === 2) {
    // 2 players: split vertically into left (index 0) and right (index 1) with wavy boundary
    const dividerX = 500 + getWavyDividerX(y, 80, 45, 2);
    if (playerIndex === 0) return x <= dividerX;
    if (playerIndex === 1) return x > dividerX;
    return false;
  }

  if (totalPlayers === 3) {
    // 3 players: 3 vertical slices with wavy boundaries
    const div1 = 333 + getWavyDividerX(y, 40, 35, 2);
    const div2 = 667 + getWavyDividerX(y, 180, 35, 2);
    if (playerIndex === 0) return x <= div1;
    if (playerIndex === 1) return x > div1 && x <= div2;
    if (playerIndex === 2) return x > div2;
    return false;
  }

  // 4 players: 2x2 quadrant split with smooth wavy borders
  const midX = 500 + getWavyDividerX(y, 50, 35, 1.5);
  const midY = 500 + getWavyDividerY(x, 70, 35, 1.5);

  const isLeft = x <= midX;
  const isTop = y <= midY;

  if (playerIndex === 0) return isLeft && isTop;        // Top-Left
  if (playerIndex === 1) return !isLeft && isTop;       // Top-Right
  if (playerIndex === 2) return isLeft && !isTop;       // Bottom-Left
  if (playerIndex === 3) return !isLeft && !isTop;      // Bottom-Right

  return true;
}

/**
 * Validates a complete stroke against a player's territory.
 * Returns valid points only (clipped/filtered) and the count of rejected points.
 */
export function validateStrokeTerritory(
  points: DrawPoint[],
  playerIndex: number,
  totalPlayers: number
): { validPoints: DrawPoint[]; rejectedCount: number } {
  const validPoints: DrawPoint[] = [];
  let rejectedCount = 0;

  for (const pt of points) {
    if (isPointInTerritory(pt, playerIndex, totalPlayers)) {
      validPoints.push(pt);
    } else {
      rejectedCount++;
    }
  }

  return { validPoints, rejectedCount };
}

/**
 * Generates polygon boundary points for client-side territory rendering.
 */
export function generateTerritoryBoundaries(totalPlayers: number): TerritoryBoundary[] {
  const colors = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24']; // ColoCo palette

  if (totalPlayers === 2) {
    const dividerPoints: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * 1000;
      const x = 500 + getWavyDividerX(y, 80, 45, 2);
      dividerPoints.push({ x: Math.round(x), y: Math.round(y) });
    }

    // Territory 0 (Left): (0,0) -> divider down (y:0..1000) -> (0, 1000)
    const p0 = [
      { x: 0, y: 0 },
      ...dividerPoints,
      { x: 0, y: 1000 }
    ];

    // Territory 1 (Right): (1000, 0) -> (1000, 1000) -> divider back up (y:1000..0)
    const p1 = [
      { x: 1000, y: 0 },
      { x: 1000, y: 1000 },
      ...dividerPoints.slice().reverse()
    ];

    return [
      { playerIndex: 0, label: 'Territory Left', points: p0, color: colors[0] },
      { playerIndex: 1, label: 'Territory Right', points: p1, color: colors[1] }
    ];
  }

  if (totalPlayers === 3) {
    const div1: { x: number; y: number }[] = [];
    const div2: { x: number; y: number }[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * 1000;
      div1.push({ x: Math.round(333 + getWavyDividerX(y, 40, 35, 2)), y: Math.round(y) });
      div2.push({ x: Math.round(667 + getWavyDividerX(y, 180, 35, 2)), y: Math.round(y) });
    }

    return [
      {
        playerIndex: 0,
        label: 'Territory 1',
        points: [{ x: 0, y: 0 }, ...div1, { x: 0, y: 1000 }],
        color: colors[0]
      },
      {
        playerIndex: 1,
        label: 'Territory 2',
        points: [...div1.slice().reverse(), ...div2],
        color: colors[1]
      },
      {
        playerIndex: 2,
        label: 'Territory 3',
        points: [{ x: 1000, y: 0 }, { x: 1000, y: 1000 }, ...div2.slice().reverse()],
        color: colors[2]
      }
    ];
  }

  // 4 players (Quadrants)
  return [
    {
      playerIndex: 0,
      label: 'Top-Left',
      points: [{ x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 500 }, { x: 0, y: 500 }],
      color: colors[0]
    },
    {
      playerIndex: 1,
      label: 'Top-Right',
      points: [{ x: 500, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 500 }, { x: 500, y: 500 }],
      color: colors[1]
    },
    {
      playerIndex: 2,
      label: 'Bottom-Left',
      points: [{ x: 0, y: 500 }, { x: 500, y: 500 }, { x: 500, y: 1000 }, { x: 0, y: 1000 }],
      color: colors[2]
    },
    {
      playerIndex: 3,
      label: 'Bottom-Right',
      points: [{ x: 500, y: 500 }, { x: 1000, y: 500 }, { x: 1000, y: 1000 }, { x: 500, y: 1000 }],
      color: colors[3]
    }
  ];
}
