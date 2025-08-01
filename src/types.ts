export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SVGElement {
  tagName: string;
  attributes: Record<string, string>;
  bbox: BoundingBox;
}

export interface EntityGroup {
  entityName: string;
  elements: SVGElement[];
  boundingBox: BoundingBox;
}

export interface FocusArea {
  name: string;
  label: string;
  color: string;
  areas: string[];
  url?: string;
}

export interface ConcaveHullResult {
  points: Point[];
  area: number;
  perimeter: number;
}

export type CurveType = 'linear' | 'catmull-rom' | 'cardinal' | 'basis' | 'basis-closed';

export interface SplineConfig {
  type: CurveType;
  tension?: number;  // For cardinal curves (0.0 to 1.0)
  alpha?: number;    // For Catmull-Rom curves (0.0 to 1.0)
}

export interface SplineResult {
  pathData: string;
  curveType: CurveType;
  originalPoints: Point[];
  smoothedPoints?: Point[];
}

export interface TextBoundingBox extends BoundingBox {
  text: string;
  fontSize: number;
  fontFamily: string;
}