import { line, curveCatmullRom, curveCardinal, curveBasis, curveBasisClosed, curveLinear } from 'd3-shape';
import { Point, CurveType, SplineConfig, SplineResult } from './types.js';

export class SplineGenerator {
  /**
   * Generate a smooth spline path from hull points
   * @param points Array of hull points
   * @param config Spline configuration
   * @returns Spline result with SVG path data
   */
  generateSpline(points: Point[], config: SplineConfig): SplineResult {
    if (points.length < 3) {
      throw new Error('At least 3 points are required to generate a spline');
    }

    // Convert points to d3-shape format [x, y][]
    const d3Points: [number, number][] = points.map(p => [p.x, p.y]);

    // Ensure the path is closed by adding the first point at the end if needed
    const firstPoint = d3Points[0];
    const lastPoint = d3Points[d3Points.length - 1];
    const needsClosure = firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1];

    if (needsClosure) {
      d3Points.push(firstPoint);
    }

    // Create line generator with appropriate curve
    const lineGenerator = line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(this.getCurveFunction(config));

    // Generate the path data
    const pathData = lineGenerator(d3Points);

    if (!pathData) {
      throw new Error('Failed to generate spline path data');
    }

    return {
      pathData,
      curveType: config.type,
      originalPoints: points,
      // Note: d3-shape doesn't expose interpolated points, so we don't populate smoothedPoints
    };
  }

  /**
   * Get the appropriate d3-shape curve function for the given configuration
   */
  private getCurveFunction(config: SplineConfig) {
    switch (config.type) {
      case 'linear':
        return curveLinear;

      case 'catmull-rom':
        // Alpha parameter for Catmull-Rom splines (0.0 = uniform, 0.5 = centripetal, 1.0 = chordal)
        return curveCatmullRom.alpha(config.alpha ?? 0.5);

      case 'cardinal':
        // Tension parameter for cardinal splines (0.0 = tight, 1.0 = loose)
        return curveCardinal.tension(config.tension ?? 0.5);

      case 'basis':
        return curveBasis;

      case 'basis-closed':
        return curveBasisClosed;

      default:
        throw new Error(`Unsupported curve type: ${config.type}`);
    }
  }

  /**
   * Create a spline configuration with sensible defaults
   */
  static createConfig(
    type: CurveType = 'catmull-rom',
    tension?: number,
    alpha?: number
  ): SplineConfig {
    const config: SplineConfig = { type };

    if (tension !== undefined) {
      config.tension = Math.max(0, Math.min(1, tension)); // Clamp to [0, 1]
    }

    if (alpha !== undefined) {
      config.alpha = Math.max(0, Math.min(1, alpha)); // Clamp to [0, 1]
    }

    return config;
  }

  /**
   * Get available curve types with descriptions
   */
  static getCurveTypes(): Record<CurveType, string> {
    return {
      'linear': 'Linear segments (no smoothing)',
      'catmull-rom': 'Catmull-Rom spline (smooth, passes through all points)',
      'cardinal': 'Cardinal spline (smooth, customizable tension)',
      'basis': 'B-spline basis (very smooth, may not pass through points)',
      'basis-closed': 'Closed B-spline basis (smooth closed curve)'
    };
  }

  /**
   * Validate spline configuration
   */
  static validateConfig(config: SplineConfig): void {
    const validTypes: CurveType[] = ['linear', 'catmull-rom', 'cardinal', 'basis', 'basis-closed'];

    if (!validTypes.includes(config.type)) {
      throw new Error(`Invalid curve type: ${config.type}. Valid types: ${validTypes.join(', ')}`);
    }

    if (config.tension !== undefined && (config.tension < 0 || config.tension > 1)) {
      throw new Error('Tension must be between 0.0 and 1.0');
    }

    if (config.alpha !== undefined && (config.alpha < 0 || config.alpha > 1)) {
      throw new Error('Alpha must be between 0.0 and 1.0');
    }
  }
}
