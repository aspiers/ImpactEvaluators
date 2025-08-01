import { Point } from './types.js';

export interface FilterConfig {
  baseFrequency: number;
  numOctaves: number;
  blurDeviation: number;
  displacementScale?: number;
  enableTexture: boolean;
}

export class WatercolorFilters {
  private static filterCounter = 0;

  /**
   * Generate unique filter ID
   */
  static generateFilterId(name: string): string {
    return `watercolor-${name}-${++this.filterCounter}`;
  }

  /**
   * Calculate blur deviation based on shape area
   * @param area Shape area in square units
   * @returns Blur deviation value
   */
  static calculateBlurScale(area: number): number {
    // Scale blur based on area: larger shapes get more blur
    const minBlur = 1.5;
    const maxBlur = 6;
    const scaleFactor = Math.sqrt(area) / 500; // Adjust scale factor as needed
    return Math.min(maxBlur, minBlur + scaleFactor);
  }

  /**
   * Calculate hull area from points
   * @param points Hull points
   * @returns Area in square units
   */
  static calculateHullArea(points: Point[]): number {
    if (points.length < 3) return 0;
    
    // Shoelace formula for polygon area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Generate SVG filter definition for watercolor effect
   * @param filterId Unique filter ID
   * @param config Filter configuration
   * @returns SVG filter definition string
   */
  static generateWatercolorFilter(filterId: string, config: FilterConfig): string {
    return `<filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="${config.baseFrequency}"
        numOctaves="${config.numOctaves}"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="${config.displacementScale || 2}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="displaced"
      />
      <feGaussianBlur
        in="displaced"
        stdDeviation="${config.blurDeviation}"
        result="blur"
      />
      <feColorMatrix
        in="noise"
        values="0.3 0.3 0.3 0 0.4, 0.3 0.3 0.3 0 0.4, 0.3 0.3 0.3 0 0.4, 0 0 0 1 0"
        result="contrastTexture"
      />
      <feComposite
        in="contrastTexture"
        in2="blur"
        operator="in"
        result="maskedTexture"
      />
      <feBlend
        in="blur"
        in2="maskedTexture"
        mode="overlay"
        result="texturedShape"
      />
    </filter>`;
  }

  /**
   * Generate complete SVG defs section with all watercolor filters
   * @param filterConfigs Array of filter configurations with IDs
   * @returns Complete SVG defs section
   */
  static generateDefsSection(
    filterConfigs: Array<{ id: string; config: FilterConfig; name: string }>
  ): string {
    const filters = filterConfigs
      .map(({ id, config }) => this.generateWatercolorFilter(id, config))
      .join('\n');
    
    return `<defs>${filters}</defs>`;
  }

  /**
   * Create default watercolor configuration
   * @param area Shape area for blur scaling
   * @param enableTexture Whether to enable texture effects
   * @returns Default filter configuration
   */
  static createDefaultConfig(area: number, enableTexture: boolean = true): FilterConfig {
    return {
      baseFrequency: 0.008,
      numOctaves: 3,
      blurDeviation: this.calculateBlurScale(area),
      displacementScale: 2,
      enableTexture
    };
  }
}