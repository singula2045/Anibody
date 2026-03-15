export const T1 = 0.0;
export const T2 = 0.3;
export const T3 = 0.6;

export const cPosMax = 30;
export const cLinkMax = 35;
export const cMaxPolyBuffer = 4000;

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 400;

// 視野角決定用パラメータ (元のプログラムと同じ値)
export const Q = 100;

export interface Point { x: number; y: number; }

export interface PolyBuffer {
  pos: Point[];    // 4 vertices
  color: number[]; // 4 brightness values
  edge: number;
  kind: number;
}

export interface PolyIndex { no: number; z: number; }

// Colors for anime polygon rendering [kind][brightness 0-3]
export const COLORS: string[][] = [
  ['#e1a0a0', '#ebb4b4', '#f5c8c8', '#ffe6e6'], // kind 0: 肌
  ['#3c3c3c', '#505050', '#646464', '#828282'], // kind 1: 髪
  ['#505050', '#646464', '#000000', '#e2e2e2'], // kind 2: 目
  ['#c8c8c8', '#dcdcdc', '#f0f0f0', '#ffffff'], // kind 3: 服
  ['#000000', '#0a0a0a', '#141414', '#e1a0a0'], // kind 4: まぶた
];
