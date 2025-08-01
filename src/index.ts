#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Command } from 'commander';
import { SVGParser } from './svgParser.js';
import { HullCalculator } from './hullCalculator.js';
import { SplineGenerator } from './splineGenerator.js';
import { HullPadding } from './hullPadding.js';
import { FocusAreaParser } from './focusAreaParser.js';
import { Point, CurveType, SplineConfig, FocusArea } from './types.js';

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
      .argument('[entity-names...]', 'Name(s) of the entities to calculate hull for (e.g., "ImpactContributor" or "Treasury FundingSource")')
      .option('-s, --svg <file>', 'SVG file path', 'ERD.svg')
      .option('-c, --concavity <number>', 'Concavity parameter (lower = more concave)', parseFloat, 20)
      .option('-l, --length-threshold <number>', 'Length threshold for edge filtering', parseFloat, 0)
      .option('-o, --output <format>', 'Output format: json, text, svg', 'json')
      .option('--curve-type <type>', 'Curve type: linear, catmull-rom, cardinal, basis, basis-closed', 'catmull-rom')
      .option('--curve-tension <number>', 'Tension for cardinal curves (0.0-1.0)', parseFloat, 0.2)
      .option('--curve-alpha <number>', 'Alpha for Catmull-Rom curves (0.0-1.0)', parseFloat, 0.5)
      .option('-p, --padding <number>', 'Padding around hull in SVG units', parseFloat, 15)
      .option('--areas <file>', 'YAML file containing focus area definitions')
      .option('-v, --verbose', 'Verbose output', false)
      .addHelpText('after', `
EXAMPLES:
  erd-hull ImpactContributor
  erd-hull ImpactContributor --curve-type cardinal --curve-tension 0.8
  erd-hull ObjectivesDesigner --output text --verbose
  erd-hull Treasury --output svg --curve-type catmull-rom > treasury-spline.svg
  erd-hull Treasury FundingSource --padding 20 --output svg > multi-entity.svg
  erd-hull "Impact*"  # Multiple entities with pattern matching
  erd-hull --areas focus-areas.yml Luca --output svg  # Use focus area definition
  erd-hull --areas focus-areas.yml --output svg      # Use all focus areas

CURVE TYPES:
  linear       - Linear segments (no smoothing)
  catmull-rom  - Catmull-Rom spline (smooth, passes through all points)
  cardinal     - Cardinal spline (smooth, customizable tension)
  basis        - B-spline basis (very smooth, may not pass through points)
  basis-closed - Closed B-spline basis (smooth closed curve)

FOCUS AREAS:
  Use --areas to define reusable entity groups with custom colors.
  The YAML file should contain an array of objects with:
    name: Focus area identifier (used as argument)
    label: Human-readable description
    color: Hex color code for the hull fill
    areas: Array of entity names to include

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
    svgContent?: string,
    customColor?: string
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

        // Use custom color from focus area if available, otherwise generate consistent color
        let fillColor: string;
        if (customColor) {
          fillColor = customColor;
        } else {
          const colorIndex = entityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % pastelColors.length;
          fillColor = pastelColors[colorIndex];
        }

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

  private formatMultipleOutput(
    results: Array<{
      name: string;
      points: Point[];
      area: number;
      perimeter: number;
      color?: string;
    }>,
    format: string,
    verbose: boolean,
    splineConfig: SplineConfig,
    svgContent?: string
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          focusAreas: results.map(result => ({
            name: result.name,
            hull: {
              points: result.points,
              area: result.area,
              perimeter: result.perimeter,
              pointCount: result.points.length
            },
            spline: {
              curveType: splineConfig.type,
              tension: splineConfig.tension,
              alpha: splineConfig.alpha
            },
            color: result.color
          }))
        }, null, 2);

      case 'text':
        let output = `Smooth Spline Hulls for ${results.length} Focus Area(s)\n`;
        output += `=================================================\n\n`;

        for (const result of results) {
          output += `Focus Area: ${result.name}\n`;
          output += `Points: ${result.points.length}\n`;
          output += `Area: ${result.area.toFixed(2)} square units\n`;
          output += `Perimeter: ${result.perimeter.toFixed(2)} units\n`;
          if (result.color) {
            output += `Color: ${result.color}\n`;
          }
          output += `Curve Type: ${splineConfig.type}\n`;
          if (splineConfig.tension !== undefined) {
            output += `Tension: ${splineConfig.tension}\n`;
          }
          if (splineConfig.alpha !== undefined) {
            output += `Alpha: ${splineConfig.alpha}\n`;
          }

          if (verbose) {
            output += `\nHull Points for ${result.name}:\n`;
            result.points.forEach((point, index) => {
              output += `  ${index + 1}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})\n`;
            });
          }
          output += '\n';
        }
        return output.trim();

      case 'svg':
        if (!svgContent) {
          // Return multiple path elements
          const splineGenerator = new SplineGenerator();
          const paths: string[] = [];

          for (const result of results) {
            const splineResult = splineGenerator.generateSpline(result.points, splineConfig);
            const fillColor = result.color || '#E5F3FF'; // Default light blue
            paths.push(`<path d="${splineResult.pathData}" fill="${fillColor}" fill-opacity="1.0" stroke="none" data-hull-entity="${result.name}" data-curve-type="${splineConfig.type}"/>`);
          }

          return paths.join('\n');
        }

        // Insert multiple spline paths right after the opening <svg> tag
        const svgMatch = svgContent.match(/<svg[^>]*>/);
        if (!svgMatch) {
          throw new Error('Invalid SVG: missing opening <svg> tag');
        }

        const openingSvgTag = svgMatch[0];
        const openingSvgIndex = svgMatch.index! + openingSvgTag.length;

        const beforePath = svgContent.substring(0, openingSvgIndex);
        const afterPath = svgContent.substring(openingSvgIndex);

        const splineGenerator = new SplineGenerator();
        const splinePaths: string[] = [];

        for (const result of results) {
          const splineResult = splineGenerator.generateSpline(result.points, splineConfig);
          const fillColor = result.color || '#E5F3FF'; // Default light blue
          splinePaths.push(`<!-- Smooth spline hull for ${result.name} (background) -->`);
          splinePaths.push(`<path d="${splineResult.pathData}" fill="${fillColor}" fill-opacity="1.0" stroke="none" data-hull-entity="${result.name}" data-curve-type="${splineConfig.type}"/>`);
        }

        return `${beforePath}\n${splinePaths.join('\n')}\n${afterPath}`;

      default:
        throw new Error(`Unknown output format: ${format}`);
    }
  }

  async run(): Promise<void> {
    this.program
      .action(async (entityNames: string[], options) => {
        try {
          // Validate that either entity names or areas file is provided
          if (entityNames.length === 0 && !options.areas) {
            throw new Error('Either entity names or --areas file must be provided');
          }

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

          // Handle focus areas file if provided
          let focusAreas: FocusArea[] = [];
          let focusAreaNames: string[] = entityNames;

          if (options.areas) {
            const areasPath = resolve(options.areas);
            if (!existsSync(areasPath)) {
              throw new Error(`Focus areas file not found: ${areasPath}`);
            }

            focusAreas = FocusAreaParser.parseFocusAreasFile(areasPath);

            // If no focus area names provided, use all focus areas
            if (entityNames.length === 0) {
              focusAreaNames = FocusAreaParser.listAvailableFocusAreas(focusAreas);
              if (options.verbose) {
                console.error(`No focus areas specified, using all: ${focusAreaNames.join(', ')}`);
              }
            }

            if (options.verbose) {
              console.error(`Focus areas file: ${areasPath}`);
              console.error(`Processing focus area(s): ${focusAreaNames.join(', ')}`);
            }
          }

          if (options.verbose) {
            console.error(`Loading SVG file: ${svgPath}`);
            console.error(`Concavity: ${options.concavity}`);
            console.error(`Length threshold: ${options.lengthThreshold}`);
          }

          // Parse SVG once
          const parser = new SVGParser(svgPath);

          // Process each focus area/entity group
          const results: Array<{
            name: string;
            points: Point[];
            area: number;
            perimeter: number;
            color?: string;
          }> = [];

          if (options.areas) {
            // Process each focus area separately
            for (const focusAreaName of focusAreaNames) {
              const entities = FocusAreaParser.getEntitiesForFocusArea(focusAreas, focusAreaName);
              const color = FocusAreaParser.getColorForFocusArea(focusAreas, focusAreaName);

              if (options.verbose) {
                console.error(`Processing focus area "${focusAreaName}" with entities: ${entities.join(', ')}`);
              }

              const points = parser.extractPointsFromEntityGroups(entities);

              if (options.verbose) {
                console.error(`Found ${points.length} points for focus area "${focusAreaName}"`);
              }

              // Calculate concave hull
              const calculator = new HullCalculator();
              const result = calculator.calculateConcaveHull(
                points,
                options.concavity,
                options.lengthThreshold
              );

              if (options.verbose) {
                console.error(`Hull calculated for "${focusAreaName}": ${result.points.length} points`);
                console.error(`Area: ${result.area.toFixed(2)}, Perimeter: ${result.perimeter.toFixed(2)}`);
              }

              // Add padding to hull points
              const paddedPoints = HullPadding.addPadding(result.points, options.padding);

              results.push({
                name: focusAreaName,
                points: paddedPoints,
                area: result.area,
                perimeter: result.perimeter,
                color
              });
            }
          } else {
            // Process single entity group (original behavior)
            const points = parser.extractPointsFromEntityGroups(entityNames);

            if (options.verbose) {
              console.error(`Searching for entities: ${entityNames.join(', ')}`);
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

            // Add padding to hull points
            const paddedPoints = HullPadding.addPadding(result.points, options.padding);

            const displayName = entityNames.length === 1 ? entityNames[0] : entityNames.join('+');
            results.push({
              name: displayName,
              points: paddedPoints,
              area: result.area,
              perimeter: result.perimeter
            });
          }

          if (options.verbose && options.padding > 0) {
            console.error(`Applied padding: ${options.padding} SVG units`);
          }

          // Read SVG content if needed for SVG output format
          const svgContent = options.output === 'svg' ? readFileSync(svgPath, 'utf-8') : undefined;

          // Create spline configuration
          const splineConfig: SplineConfig = {
            type: options.curveType as CurveType,
            tension: options.curveTension,
            alpha: options.curveAlpha
          };

          // Output results
          const output = this.formatMultipleOutput(
            results,
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
