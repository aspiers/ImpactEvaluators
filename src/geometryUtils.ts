import { Point } from './types.js';

export class GeometryUtils {
  /**
   * Calculate the centroid (arithmetic mean) of a set of points
   * @param points Array of points
   * @returns Centroid point
   */
  static calculateCentroid(points: Point[]): Point {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    const centroid = points.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    centroid.x /= points.length;
    centroid.y /= points.length;
    return centroid;
  }
}