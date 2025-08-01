#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Command } from 'commander';
import { SVGParser } from './svgParser.js';
import { HullCalculator } from './hullCalculator.js';
import { SplineGenerator } from './splineGenerator.js';
import { HullPadding } from './hullPadding.js';
import { GeometryUtils } from './geometryUtils.js';
import { FocusAreaParser } from './focusAreaParser.js';
import { WatercolorEffect } from './watercolorEffect.js';
import { Point, CurveType, SplineConfig, FocusArea } from './types.js';

class ERDHullCLI {
  private program: Command;

  // Text label styling constants
  private static readonly TEXT_STYLE = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '36',
    fillOpacity: '0.3',
    fontWeight: 'bold',
    fill: '#333',
    textAnchor: 'middle',
    dominantBaseline: 'middle'
  } as const;

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
  erd-hull ObjectivesDesigner --verbose
  erd-hull Treasury --curve-type catmull-rom > treasury-spline.svg
  erd-hull Treasury FundingSource --padding 20 > multi-entity.svg
  erd-hull "Impact*"  # Multiple entities with pattern matching
  erd-hull --areas focus-areas.yml Luca  # Use focus area definition
  erd-hull --areas focus-areas.yml      # Use all focus areas

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
    color: Color for the hull fill (hex like #FF0000, named like "pink", or RGB)
    areas: Array of entity names to include
    url: Optional URL to hyperlink the focus area (makes hull clickable)

The tool outputs SVG with smooth spline curve overlay.`);
  }

  private createTextElement(name: string, centroid: Point): string {
    const style = ERDHullCLI.TEXT_STYLE;
    return `<text x="${centroid.x.toFixed(2)}" y="${centroid.y.toFixed(2)}" text-anchor="${style.textAnchor}" dominant-baseline="${style.dominantBaseline}" font-family="${style.fontFamily}" font-size="${style.fontSize}" fill-opacity="${style.fillOpacity}" font-weight="${style.fontWeight}" fill="${style.fill}" data-label-for="${name}">${name}</text>`;
  }

  private generateSVGOutput(
    results: Array<{
      name: string;
      points: Point[];
      area: number;
      perimeter: number;
      color?: string;
      url?: string;
    }>,
    splineConfig: SplineConfig,
    svgContent?: string
  ): string {
    if (!svgContent) {
      // Return multiple path elements with text labels
      const splineGenerator = new SplineGenerator();
      const elements: string[] = [];

      for (const result of results) {
        const splineResult = splineGenerator.generateSpline(result.points, splineConfig);
        const fillColor = result.color || '#E5F3FF'; // Default light blue

        // Generate watercolor layers
        const watercolorLayers = WatercolorEffect.generateWatercolorLayers(splineResult.pathData, fillColor, 6);

        // Create group for watercolor effect
        elements.push(`<g data-watercolor-group="${result.name}">`);

        // Add each watercolor layer
        for (const layer of watercolorLayers) {
          const pathElement = `<path d="${layer.pathData}" fill="${layer.color}" fill-opacity="${layer.opacity}" stroke="none" data-hull-entity="${result.name}" data-curve-type="${splineConfig.type}"/>`;
          elements.push(pathElement);
        }

        elements.push('</g>');

        // Add text label
        const centroid = GeometryUtils.calculateCentroid(result.points);
        const textElement = this.createTextElement(result.name, centroid);
        elements.push(textElement);
      }

      return elements.join('\n');
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
    const textLabels: string[] = [];

    for (const result of results) {
      const splineResult = splineGenerator.generateSpline(result.points, splineConfig);
      const fillColor = result.color || '#E5F3FF'; // Default light blue

      // Generate watercolor layers
      const watercolorLayers = WatercolorEffect.generateWatercolorLayers(splineResult.pathData, fillColor, 6);

      splinePaths.push(`<!-- Watercolor spline hull for ${result.name} (background) -->`);

      // Handle URL wrapping for the entire watercolor group
      if (result.url) {
        splinePaths.push(`<a href="${result.url}" xlink:href="${result.url}">`);
        splinePaths.push(`<g data-watercolor-group="${result.name}">`);

        // Add each watercolor layer
        for (const layer of watercolorLayers) {
          const pathElement = `<path d="${layer.pathData}" fill="${layer.color}" fill-opacity="${layer.opacity}" stroke="none" data-hull-entity="${result.name}" data-curve-type="${splineConfig.type}"/>`;
          splinePaths.push(pathElement);
        }

        splinePaths.push('</g>');
        splinePaths.push('</a>');
      } else {
        splinePaths.push(`<g data-watercolor-group="${result.name}">`);

        // Add each watercolor layer
        for (const layer of watercolorLayers) {
          const pathElement = `<path d="${layer.pathData}" fill="${layer.color}" fill-opacity="${layer.opacity}" stroke="none" data-hull-entity="${result.name}" data-curve-type="${splineConfig.type}"/>`;
          splinePaths.push(pathElement);
        }

        splinePaths.push('</g>');
      }

      // Calculate centroid for text label positioning
      const centroid = GeometryUtils.calculateCentroid(result.points);
      const textElement = this.createTextElement(result.name, centroid);
      textLabels.push(`<!-- Text label for ${result.name} -->`);
      textLabels.push(textElement);
    }

    return `${beforePath}\n${splinePaths.join('\n')}\n${textLabels.join('\n')}\n${afterPath}`;
  }

  async run(): Promise<void> {
    this.program
      .action(async (entityNames: string[], options) => {
        try {
          // Validate that either entity names or areas file is provided
          if (entityNames.length === 0 && !options.areas) {
            throw new Error('Either entity names or --areas file must be provided');
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
            url?: string;
          }> = [];

          if (options.areas) {
            // Process each focus area separately
            for (const focusAreaName of focusAreaNames) {
              const entities = FocusAreaParser.getEntitiesForFocusArea(focusAreas, focusAreaName);
              const color = FocusAreaParser.getColorForFocusArea(focusAreas, focusAreaName);
              const url = FocusAreaParser.getUrlForFocusArea(focusAreas, focusAreaName);

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
                color,
                url
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

          // Read SVG content for SVG output
          const svgContent = readFileSync(svgPath, 'utf-8');

          // Create spline configuration
          const splineConfig: SplineConfig = {
            type: options.curveType as CurveType,
            tension: options.curveTension,
            alpha: options.curveAlpha
          };

          // Generate SVG output
          const output = this.generateSVGOutput(
            results,
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
