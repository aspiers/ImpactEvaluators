import { Point, BoundingBox, TextBoundingBox } from './types.js';

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

  /**
   * Calculate bounding box for text given font properties
   */
  static calculateBoundingBox(
    text: string,
    fontSize: number,
    fontFamily: string
  ): { width: number; height: number } {
    // Approximate text dimensions based on font size
    // These are rough estimates - real implementation would use canvas measurements
    const avgCharWidth = fontSize * 0.6; // Rough estimate for typical fonts
    const textWidth = text.length * avgCharWidth;
    const textHeight = fontSize;

    return {
      width: textWidth,
      height: textHeight
    };
  }

  /**
   * Check if two rectangles overlap
   */
  static rectanglesOverlap(rect1: BoundingBox, rect2: BoundingBox): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Find the nearest non-colliding position for a text label
   */
  static findNearestNonCollidingPosition(
    text: string,
    fontSize: number,
    fontFamily: string,
    preferredPosition: Point,
    existingBoxes: BoundingBox[],
    maxSearchDistance: number = 200,
    distanceIncrement: number = 20,
    collisionBuffer: number = 5
  ): Point {
    const candidates = GeometryUtils.generateCandidatePositions(
      preferredPosition,
      maxSearchDistance,
      distanceIncrement
    );

    for (const candidate of candidates) {
      const textDimensions = GeometryUtils.calculateBoundingBox(text, fontSize, fontFamily);
      const textBox: BoundingBox = {
        x: candidate.x - (textDimensions.width / 2) - collisionBuffer,
        y: candidate.y - (textDimensions.height / 2) - collisionBuffer,
        width: textDimensions.width + (collisionBuffer * 2),
        height: textDimensions.height + (collisionBuffer * 2)
      };

      let hasCollision = false;
      for (const existingBox of existingBoxes) {
        if (GeometryUtils.rectanglesOverlap(textBox, existingBox)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return candidate;
      }
    }

    // Fallback: use preferred position even if it collides
    return preferredPosition;
  }

  /**
   * Generate candidate positions in concentric circles around a center point
   */
  private static generateCandidatePositions(
    center: Point,
    maxDistance: number,
    distanceIncrement: number
  ): Point[] {
    const candidates: Point[] = [];
    
    // Start with the center itself
    candidates.push(center);

    // Generate positions in concentric circles
    for (let distance = distanceIncrement; distance <= maxDistance; distance += distanceIncrement) {
      // 8 cardinal and ordinal directions
      const directions = [
        { x: 0, y: -1 },    // North
        { x: 1, y: -1 },    // Northeast
        { x: 1, y: 0 },     // East
        { x: 1, y: 1 },     // Southeast
        { x: 0, y: 1 },     // South
        { x: -1, y: 1 },    // Southwest
        { x: -1, y: 0 },    // West
        { x: -1, y: -1 },   // Northwest
      ];

      for (const dir of directions) {
        candidates.push({
          x: center.x + (dir.x * distance),
          y: center.y + (dir.y * distance)
        });
      }
    }

    return candidates;
  }
}