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

export interface ConcaveHullResult {
  points: Point[];
  area: number;
  perimeter: number;
}