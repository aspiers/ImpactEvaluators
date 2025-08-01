import concaveman from 'concaveman';
import { Point, ConcaveHullResult } from './types.js';

export class HullCalculator {
  /**
   * Calculate concave hull for a set of points
   * @param points Array of points to calculate hull for
   * @param concavity Concavity parameter (lower = more concave, higher = more convex)
   * @param lengthThreshold Length threshold for edge filtering
   * @returns Concave hull result with points, area, and perimeter
   */
  calculateConcaveHull(
    points: Point[],
    concavity: number = 2,
    lengthThreshold: number = 0
  ): ConcaveHullResult {

    if (points.length < 3) {
      throw new Error('At least 3 points are required to calculate a hull');
    }

    // Remove duplicate points
    const uniquePoints = this.removeDuplicatePoints(points);

    if (uniquePoints.length < 3) {
      throw new Error('At least 3 unique points are required to calculate a hull');
    }

    // Convert points to the format expected by concaveman [[x, y], [x, y], ...]
    const inputPoints: number[][] = uniquePoints.map(p => [p.x, p.y]);

    // Calculate concave hull
    const hullCoords = concaveman(inputPoints, concavity, lengthThreshold);

    // Convert back to Point objects
    const hullPoints: Point[] = hullCoords.map((coord: number[]) => ({
      x: coord[0],
      y: coord[1]
    }));

    // Calculate area and perimeter
    const area = this.calculatePolygonArea(hullPoints);
    const perimeter = this.calculatePolygonPerimeter(hullPoints);

    return {
      points: hullPoints,
      area: Math.abs(area),
      perimeter
    };
  }

  /**
   * Remove duplicate points from the array
   */
  private removeDuplicatePoints(points: Point[], tolerance: number = 0.001): Point[] {
    const unique: Point[] = [];

    for (const point of points) {
      const isDuplicate = unique.some(existing =>
        Math.abs(existing.x - point.x) < tolerance &&
        Math.abs(existing.y - point.y) < tolerance
      );

      if (!isDuplicate) {
        unique.push(point);
      }
    }

    return unique;
  }

  /**
   * Calculate area of a polygon using the shoelace formula
   */
  private calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return area / 2;
  }

  /**
   * Calculate perimeter of a polygon
   */
  private calculatePolygonPerimeter(points: Point[]): number {
    if (points.length < 2) return 0;

    let perimeter = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    return perimeter;
  }

  /**
   * Get distance between two points
   */
  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate convex hull for comparison (using Graham scan algorithm)
   */
  calculateConvexHull(points: Point[]): Point[] {
    if (points.length < 3) {
      throw new Error('At least 3 points are required to calculate a convex hull');
    }

    const uniquePoints = this.removeDuplicatePoints(points);

    if (uniquePoints.length < 3) {
      throw new Error('At least 3 unique points are required to calculate a convex hull');
    }

    // Find the bottom-most point (and leftmost in case of tie)
    let start = uniquePoints[0];
    for (const point of uniquePoints) {
      if (point.y < start.y || (point.y === start.y && point.x < start.x)) {
        start = point;
      }
    }

    // Sort points by polar angle with respect to start point
    const sortedPoints = uniquePoints
      .filter(p => p !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - start.y, a.x - start.x);
        const angleB = Math.atan2(b.y - start.y, b.x - start.x);
        return angleA - angleB;
      });

    // Graham scan
    const hull: Point[] = [start];

    for (const point of sortedPoints) {
      // Remove points that make a right turn
      while (hull.length > 1 && this.crossProduct(
        hull[hull.length - 2],
        hull[hull.length - 1],
        point
      ) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * Calculate cross product for three points (used in convex hull calculation)
   */
  private crossProduct(o: Point, a: Point, b: Point): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }
}
