#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Command } from 'commander';
import { SVGParser } from './svgParser.js';
import { HullCalculator } from './hullCalculator.js';
import { SplineGenerator } from './splineGenerator.js';
import { Point, CurveType, SplineConfig } from './types.js';

class ERDHullCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupProgram();
  }

  private setupProgram(): void {
    this.program
      .name('erd-hull')
      .description('Calculate smooth spline curves around entity groups in SVG files')
      .version('1.0.0')
      .argument('<entity-name>', 'Name of the entity to calculate hull for (e.g., "ImpactContributor")')
      .option('-s, --svg <file>', 'SVG file path', 'ERD.svg')
      .option('-c, --concavity <number>', 'Concavity parameter (lower = more concave)', parseFloat, 2)
      .option('-l, --length-threshold <number>', 'Length threshold for edge filtering', parseFloat, 0)
      .option('-o, --output <format>', 'Output format: json, text, svg', 'json')
      .option('--curve-type <type>', 'Curve type: linear, catmull-rom, cardinal, basis, basis-closed', 'catmull-rom')
      .option('--curve-tension <number>', 'Tension for cardinal curves (0.0-1.0)', parseFloat, 0.5)
      .option('--curve-alpha <number>', 'Alpha for Catmull-Rom curves (0.0-1.0)', parseFloat, 0.5)
      .option('-v, --verbose', 'Verbose output', false)
      .addHelpText('after', `
EXAMPLES:
  erd-hull ImpactContributor
  erd-hull ImpactContributor --curve-type cardinal --curve-tension 0.8
  erd-hull ObjectivesDesigner --output text --verbose
  erd-hull Treasury --output svg --curve-type catmull-rom > treasury-spline.svg

CURVE TYPES:
  linear       - Linear segments (no smoothing)
  catmull-rom  - Catmull-Rom spline (smooth, passes through all points)
  cardinal     - Cardinal spline (smooth, customizable tension)
  basis        - B-spline basis (very smooth, may not pass through points)
  basis-closed - Closed B-spline basis (smooth closed curve)

OUTPUT FORMATS:
  json - JSON object with hull points, area, and perimeter
  text - Human-readable summary
  svg  - Complete SVG with smooth spline curve overlay`);
  }

  private formatOutput(
    entityName: string,
    points: Point[],
    area: number,
    perimeter: number,
    format: string,
    verbose: boolean,
    splineConfig: SplineConfig,
    svgContent?: string
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          entityName,
          hull: {
            points,
            area,
            perimeter,
            pointCount: points.length
          },
          spline: {
            curveType: splineConfig.type,
            tension: splineConfig.tension,
            alpha: splineConfig.alpha
          }
        }, null, 2);

      case 'text':
        let output = `Smooth Spline Hull for Entity: ${entityName}\n`;
        output += `==========================================\n`;
        output += `Points: ${points.length}\n`;
        output += `Area: ${area.toFixed(2)} square units\n`;
        output += `Perimeter: ${perimeter.toFixed(2)} units\n`;
        output += `Curve Type: ${splineConfig.type}\n`;
        if (splineConfig.tension !== undefined) {
          output += `Tension: ${splineConfig.tension}\n`;
        }
        if (splineConfig.alpha !== undefined) {
          output += `Alpha: ${splineConfig.alpha}\n`;
        }

        if (verbose) {
          output += `\nHull Points:\n`;
          points.forEach((point, index) => {
            output += `  ${index + 1}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})\n`;
          });
        }
        return output;

      case 'svg':
        // Generate smooth spline path
        const splineGenerator = new SplineGenerator();
        const splineResult = splineGenerator.generateSpline(points, splineConfig);

        // Use a semi-transparent pastel color for the fill
        // You can customize these colors per entity or use a color generator
        const pastelColors = [
          '#FFE5E5', // Light pink
          '#E5F3FF', // Light blue
          '#E5FFE5', // Light green
          '#FFF5E5', // Light peach
          '#F5E5FF', // Light purple
          '#FFFFE5', // Light yellow
        ];

        // Generate a consistent color based on entity name
        const colorIndex = entityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length;
        const fillColor = pastelColors[colorIndex];

        const splinePath = `<path d="${splineResult.pathData}" fill="${fillColor}" fill-opacity="1.0" stroke="none" data-hull-entity="${entityName}" data-curve-type="${splineConfig.type}"/>`;

        if (!svgContent) {
          return splinePath;
        }

        // Insert the spline path right after the opening <svg> tag so it appears behind everything
        const svgMatch = svgContent.match(/<svg[^>]*>/);
        if (!svgMatch) {
          throw new Error('Invalid SVG: missing opening <svg> tag');
        }

        const openingSvgTag = svgMatch[0];
        const openingSvgIndex = svgMatch.index! + openingSvgTag.length;

        const beforePath = svgContent.substring(0, openingSvgIndex);
        const afterPath = svgContent.substring(openingSvgIndex);

        return `${beforePath}
<!-- Smooth spline hull for ${entityName} (background) -->
${splinePath}
${afterPath}`;

      default:
        throw new Error(`Unknown output format: ${format}`);
    }
  }

  async run(): Promise<void> {
    this.program
      .action(async (entityName: string, options) => {
        try {
          // Validate output format
          if (!['json', 'text', 'svg'].includes(options.output)) {
            throw new Error(`Invalid output format: ${options.output}. Must be one of: json, text, svg`);
          }

          // Validate curve type
          const validCurveTypes: CurveType[] = ['linear', 'catmull-rom', 'cardinal', 'basis', 'basis-closed'];
          if (!validCurveTypes.includes(options.curveType)) {
            throw new Error(`Invalid curve type: ${options.curveType}. Must be one of: ${validCurveTypes.join(', ')}`);
          }

          // Resolve SVG file path
          const svgPath = resolve(options.svg);

          if (!existsSync(svgPath)) {
            throw new Error(`SVG file not found: ${svgPath}`);
          }

          if (options.verbose) {
            console.error(`Loading SVG file: ${svgPath}`);
            console.error(`Searching for entity: ${entityName}`);
            console.error(`Concavity: ${options.concavity}`);
            console.error(`Length threshold: ${options.lengthThreshold}`);
          }

          // Parse SVG and extract points
          const parser = new SVGParser(svgPath);
          const points = parser.extractPointsFromEntityGroup(entityName);

          if (options.verbose) {
            console.error(`Found ${points.length} points in entity group`);
          }

          // Calculate concave hull
          const calculator = new HullCalculator();
          const result = calculator.calculateConcaveHull(
            points,
            options.concavity,
            options.lengthThreshold
          );

          if (options.verbose) {
            console.error(`Hull calculated: ${result.points.length} points`);
            console.error(`Area: ${result.area.toFixed(2)}, Perimeter: ${result.perimeter.toFixed(2)}`);
          }

          // Read SVG content if needed for SVG output format
          const svgContent = options.output === 'svg' ? readFileSync(svgPath, 'utf-8') : undefined;

          // Create spline configuration
          const splineConfig: SplineConfig = {
            type: options.curveType as CurveType,
            tension: options.curveTension,
            alpha: options.curveAlpha
          };

          // Output result
          const output = this.formatOutput(
            entityName,
            result.points,
            result.area,
            result.perimeter,
            options.output,
            options.verbose,
            splineConfig,
            svgContent
          );

          console.log(output);

        } catch (error) {
          if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
          } else {
            console.error('An unexpected error occurred');
          }
          process.exit(1);
        }
      });

    this.program.parse();
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ERDHullCLI();
  cli.run();
}

export { ERDHullCLI };
