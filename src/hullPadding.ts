import { Point } from './types.js';
import { GeometryUtils } from './geometryUtils.js';

export class HullPadding {

  /**
   * Add padding to hull points by expanding them outward from the centroid
   * @param points Array of hull points
   * @param padding Amount of padding to add (in SVG units)
   * @returns Array of padded hull points
   */
  static addPadding(points: Point[], padding: number): Point[] {
    if (padding <= 0) {
      return points;
    }

    // Calculate centroid (center point) of the hull
    const centroid = GeometryUtils.calculateCentroid(points);

    // Expand each point outward from centroid
    return points.map(point => {
      const dx = point.x - centroid.x;
      const dy = point.y - centroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) return point;

      const scale = (distance + padding) / distance;
      return {
        x: centroid.x + dx * scale,
        y: centroid.y + dy * scale
      };
    });
  }
}