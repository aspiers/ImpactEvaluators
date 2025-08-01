import { Point } from './types.js';
import { GeometryUtils } from './geometryUtils.js';

export class WatercolorEffect {
  /**
   * Generate watercolor effect by creating multiple slightly varied path layers
   * @param points Original hull points
   * @param baseColor Base color for the watercolor effect
   * @param layers Number of watercolor layers (default: 5)
   * @returns Array of SVG path data strings with varying opacity
   */
  static generateWatercolorLayers(
    pathData: string,
    baseColor: string,
    layers: number = 5
  ): Array<{ pathData: string; opacity: number; color: string }> {
    const watercolorLayers: Array<{ pathData: string; opacity: number; color: string }> = [];
    
    // Base layer with full opacity
    watercolorLayers.push({
      pathData,
      opacity: 0.2,
      color: baseColor
    });
    
    // Generate additional layers with variations
    for (let i = 1; i < layers; i++) {
      const variation = this.createPathVariation(pathData, i);
      const opacity = Math.max(0.05, 0.15 - (i * 0.02)); // Decreasing opacity
      const colorVariation = this.varyColor(baseColor, i);
      
      watercolorLayers.push({
        pathData: variation,
        opacity,
        color: colorVariation
      });
    }
    
    return watercolorLayers;
  }
  
  /**
   * Create a subtle variation of the original path
   * @param originalPath Original SVG path data
   * @param variationIndex Index of variation (affects amount of change)
   * @returns Modified path data
   */
  private static createPathVariation(originalPath: string, variationIndex: number): string {
    // Extract coordinates from path data
    const coords = this.extractCoordinatesFromPath(originalPath);
    if (coords.length === 0) return originalPath;
    
    // Apply random offsets with seeded randomness for consistency
    const seed = variationIndex * 123.456; // Deterministic seed
    const maxOffset = Math.min(8, variationIndex * 2); // Increasing variation
    
    const variedCoords = coords.map((coord, index) => {
      const offsetX = this.seededRandom(seed + index * 2) * maxOffset - maxOffset / 2;
      const offsetY = this.seededRandom(seed + index * 2 + 1) * maxOffset - maxOffset / 2;
      
      return {
        x: coord.x + offsetX,
        y: coord.y + offsetY
      };
    });
    
    // Reconstruct path data with varied coordinates
    return this.reconstructPathData(originalPath, variedCoords);
  }
  
  /**
   * Create subtle color variations for layering effect
   * @param baseColor Base color in hex format
   * @param variationIndex Index of variation
   * @returns Slightly modified color
   */
  private static varyColor(baseColor: string, variationIndex: number): string {
    // Convert hex to RGB
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return baseColor;
    
    // Apply subtle variations
    const variation = variationIndex * 5; // Small color shifts
    const newR = Math.max(0, Math.min(255, rgb.r + (this.seededRandom(variationIndex * 7) * variation - variation / 2)));
    const newG = Math.max(0, Math.min(255, rgb.g + (this.seededRandom(variationIndex * 11) * variation - variation / 2)));
    const newB = Math.max(0, Math.min(255, rgb.b + (this.seededRandom(variationIndex * 13) * variation - variation / 2)));
    
    return this.rgbToHex(Math.round(newR), Math.round(newG), Math.round(newB));
  }
  
  /**
   * Seeded random number generator for consistent variations
   * @param seed Seed value
   * @returns Random number between 0 and 1
   */
  private static seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  /**
   * Extract coordinate pairs from SVG path data
   * @param pathData SVG path data string
   * @returns Array of coordinate points
   */
  private static extractCoordinatesFromPath(pathData: string): Point[] {
    const coords: Point[] = [];
    // Match number pairs in the path data
    const numbers = pathData.match(/-?\d+\.?\d*/g);
    
    if (numbers) {
      for (let i = 0; i < numbers.length - 1; i += 2) {
        coords.push({
          x: parseFloat(numbers[i]),
          y: parseFloat(numbers[i + 1])
        });
      }
    }
    
    return coords;
  }
  
  /**
   * Reconstruct path data with new coordinates
   * @param originalPath Original path data
   * @param newCoords New coordinate points
   * @returns Modified path data
   */
  private static reconstructPathData(originalPath: string, newCoords: Point[]): string {
    let coordIndex = 0;
    return originalPath.replace(/-?\d+\.?\d*/g, (match) => {
      if (coordIndex < newCoords.length * 2) {
        const coord = coordIndex % 2 === 0 
          ? newCoords[Math.floor(coordIndex / 2)].x 
          : newCoords[Math.floor(coordIndex / 2)].y;
        coordIndex++;
        return coord.toFixed(2);
      }
      return match;
    });
  }
  
  /**
   * Convert hex color to RGB
   * @param hex Hex color string
   * @returns RGB object or null if invalid
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * Convert RGB to hex color
   * @param r Red value (0-255)
   * @param g Green value (0-255)
   * @param b Blue value (0-255)
   * @returns Hex color string
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}