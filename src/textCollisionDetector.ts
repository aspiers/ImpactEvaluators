import { Point, BoundingBox, TextBoundingBox, SVGElement } from './types.js';
import { SVGParser } from './svgParser.js';

export class TextCollisionDetector {
  private existingSvgElements: BoundingBox[] = [];
  private existingTextLabels: TextBoundingBox[] = [];
  private readonly collisionBuffer: number = 5;
  private readonly maxSearchDistance: number = 200;
  private readonly distanceIncrement: number = 20;

  constructor(private svgParser: SVGParser) {}

  /**
   * Extract all existing SVG text elements and their bounding boxes
   */
  extractExistingSvgElements(): BoundingBox[] {
    const elements: BoundingBox[] = [];

    // Get all text elements from the SVG - these are the most important to avoid
    const textElements = this.svgParser.getAllTextElements();
    for (const element of textElements) {
      if (element.bbox && this.isValidBoundingBox(element.bbox)) {
        elements.push({
          x: element.bbox.x - this.collisionBuffer,
          y: element.bbox.y - this.collisionBuffer,
          width: element.bbox.width + (this.collisionBuffer * 2),
          height: element.bbox.height + (this.collisionBuffer * 2)
        });
      }
    }

    // Get specific element types that are likely to be meaningful obstacles
    const allElements = this.svgParser.getAllElements();
    for (const element of allElements) {
      // Only consider simple shapes and text elements, skip complex paths
      if (this.shouldConsiderForCollision(element) && this.isValidBoundingBox(element.bbox)) {
        elements.push({
          x: element.bbox.x - this.collisionBuffer,
          y: element.bbox.y - this.collisionBuffer,
          width: element.bbox.width + (this.collisionBuffer * 2),
          height: element.bbox.height + (this.collisionBuffer * 2)
        });
      }
    }

    this.existingSvgElements = elements;
    return elements;
  }

  /**
   * Check if an element should be considered for collision detection
   */
  private shouldConsiderForCollision(element: any): boolean {
    const tagName = element.tagName.toLowerCase();

    // Include text elements and simple shapes
    if (['text', 'rect', 'circle', 'ellipse'].includes(tagName)) {
      return true;
    }

    // Skip complex paths and lines as they often have incorrect bounding boxes
    if (['path', 'line', 'g', 'svg', 'defs', 'filter'].includes(tagName)) {
      return false;
    }

    return false;
  }

  /**
   * Check if a bounding box is reasonable (not covering the entire SVG)
   */
  private isValidBoundingBox(bbox: any): boolean {
    if (!bbox) return false;

    // Filter out obviously wrong bounding boxes
    if (bbox.width > 1000 || bbox.height > 1000) {
      return false;
    }

    if (bbox.x < -50 || bbox.y < -50) {
      return false;
    }

    if (bbox.width <= 0 || bbox.height <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Calculate bounding box for text given font properties
   */
  calculateTextBoundingBox(
    text: string,
    fontSize: number,
    fontFamily: string,
    position: Point
  ): TextBoundingBox {
    // Approximate text dimensions based on font size
    // These are rough estimates - real implementation would use canvas measurements
    const avgCharWidth = fontSize * 0.6; // Rough estimate for typical fonts
    const textWidth = text.length * avgCharWidth;
    const textHeight = fontSize;

    return {
      text,
      fontSize,
      fontFamily,
      x: position.x - (textWidth / 2), // text-anchor: middle
      y: position.y - (textHeight / 2), // dominant-baseline: middle
      width: textWidth,
      height: textHeight
    };
  }

  /**
   * Check if two rectangles overlap
   */
  rectanglesOverlap(rect1: BoundingBox, rect2: BoundingBox): boolean {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  }

  /**
   * Check if a text bounding box collides with existing elements
   */
  private hasCollision(textBox: TextBoundingBox): boolean {
    // Check against existing SVG elements
    for (const element of this.existingSvgElements) {
      if (this.rectanglesOverlap(textBox, element)) {
        return true;
      }
    }

    // Check against other text labels we've already positioned
    for (const existingLabel of this.existingTextLabels) {
      if (this.rectanglesOverlap(textBox, existingLabel)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate candidate positions in concentric circles around centroid
   */
  private generateCandidatePositions(centroid: Point): Point[] {
    const candidates: Point[] = [];

    // Start with the centroid itself
    candidates.push(centroid);

    // Generate positions in concentric circles
    for (let distance = this.distanceIncrement; distance <= this.maxSearchDistance; distance += this.distanceIncrement) {
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
          x: centroid.x + (dir.x * distance),
          y: centroid.y + (dir.y * distance)
        });
      }
    }

    return candidates;
  }

  /**
   * Find the best position for a text label that minimizes collisions
   */
  findNearestNonCollidingPosition(
    text: string,
    fontSize: number,
    fontFamily: string,
    preferredPosition: Point
  ): Point {
    const candidates = this.generateCandidatePositions(preferredPosition);
    let bestPosition = preferredPosition;
    let bestScore = this.calculatePositionScore(text, fontSize, fontFamily, preferredPosition, preferredPosition);

    for (const candidate of candidates) {
      const score = this.calculatePositionScore(text, fontSize, fontFamily, candidate, preferredPosition);
      
      if (score < bestScore) {
        bestScore = score;
        bestPosition = candidate;
      }
    }

    // Register the chosen position so future labels avoid it
    const chosenBox = this.calculateTextBoundingBox(text, fontSize, fontFamily, bestPosition);
    this.existingTextLabels.push(chosenBox);
    return bestPosition;
  }

  /**
   * Calculate a score for a position (lower is better)
   * Considers both collision count and distance from preferred position
   */
  private calculatePositionScore(
    text: string,
    fontSize: number,
    fontFamily: string,
    position: Point,
    preferredPosition: Point
  ): number {
    const textBox = this.calculateTextBoundingBox(text, fontSize, fontFamily, position);
    
    // Count collisions with existing elements
    let collisionCount = 0;
    let totalCollisionArea = 0;
    
    for (const element of this.existingSvgElements) {
      if (this.rectanglesOverlap(textBox, element)) {
        collisionCount++;
        // Calculate overlap area for weighting
        const overlapArea = this.calculateOverlapArea(textBox, element);
        totalCollisionArea += overlapArea;
      }
    }
    
    // Check collision with other text labels (these are more important to avoid)
    let textCollisionCount = 0;
    for (const existingLabel of this.existingTextLabels) {
      if (this.rectanglesOverlap(textBox, existingLabel)) {
        textCollisionCount++;
        totalCollisionArea += this.calculateOverlapArea(textBox, existingLabel) * 2; // Weight text collisions more heavily
      }
    }
    
    // Calculate distance from preferred position
    const distance = Math.sqrt(
      Math.pow(position.x - preferredPosition.x, 2) + 
      Math.pow(position.y - preferredPosition.y, 2)
    );
    
    // Score formula: prioritize staying close to centroid, but penalize collisions
    // Text collisions are weighted more heavily than element collisions
    const collisionPenalty = (collisionCount * 50) + (textCollisionCount * 300) + (totalCollisionArea * 0.05);
    const distancePenalty = distance * 3; // Higher penalty for distance to keep labels closer
    
    return distancePenalty + collisionPenalty;
  }

  /**
   * Calculate the overlap area between two rectangles
   */
  private calculateOverlapArea(rect1: BoundingBox, rect2: BoundingBox): number {
    const overlapLeft = Math.max(rect1.x, rect2.x);
    const overlapRight = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const overlapTop = Math.max(rect1.y, rect2.y);
    const overlapBottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
    
    if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
      return (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
    }
    
    return 0;
  }

  /**
   * Reset the collision detector for a new set of labels
   */
  reset(): void {
    this.existingTextLabels = [];
    // Keep existing SVG elements but clear text labels
  }
}
