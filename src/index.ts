#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { SVGParser } from './svgParser.js';
import { HullCalculator } from './hullCalculator.js';
import { SplineGenerator } from './splineGenerator.js';
import { Point, CurveType, SplineConfig } from './types.js';

interface CLIOptions {
  entityName: string;
  svgFile: string;
  concavity: number;
  lengthThreshold: number;
  outputFormat: 'json' | 'text' | 'svg';
  curveType: CurveType;
  curveTension: number;
  curveAlpha: number;
  verbose: boolean;
  help: boolean;
}

class ERDHullCLI {
  private defaultSvgFile = 'ERD.svg';

  parseArguments(args: string[]): CLIOptions {
    const options: CLIOptions = {
      entityName: '',
      svgFile: this.defaultSvgFile,
      concavity: 2,
      lengthThreshold: 0,
      outputFormat: 'json',
      curveType: 'catmull-rom',
      curveTension: 0.5,
      curveAlpha: 0.5,
      verbose: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--help':
        case '-h':
          options.help = true;
          break;
        case '--svg':
        case '-s':
          if (i + 1 < args.length) {
            options.svgFile = args[++i];
          }
          break;
        case '--concavity':
        case '-c':
          if (i + 1 < args.length) {
            options.concavity = parseFloat(args[++i]);
          }
          break;
        case '--length-threshold':
        case '-l':
          if (i + 1 < args.length) {
            options.lengthThreshold = parseFloat(args[++i]);
          }
          break;
        case '--output':
        case '-o':
          if (i + 1 < args.length) {
            const format = args[++i];
            if (['json', 'text', 'svg'].includes(format)) {
              options.outputFormat = format as 'json' | 'text' | 'svg';
            }
          }
          break;
        case '--curve-type':
        case '--curve':
          if (i + 1 < args.length) {
            const curveType = args[++i];
            if (['linear', 'catmull-rom', 'cardinal', 'basis', 'basis-closed'].includes(curveType)) {
              options.curveType = curveType as CurveType;
            }
          }
          break;
        case '--curve-tension':
        case '--tension':
          if (i + 1 < args.length) {
            options.curveTension = parseFloat(args[++i]);
          }
          break;
        case '--curve-alpha':
        case '--alpha':
          if (i + 1 < args.length) {
            options.curveAlpha = parseFloat(args[++i]);
          }
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        default:
          if (!arg.startsWith('-') && !options.entityName) {
            options.entityName = arg;
          }
          break;
      }
    }

    return options;
  }

  showHelp(): void {
    console.log(`
ERD Hull Calculator - Calculate smooth spline curves around entity groups in SVG files

USAGE:
  erd-hull <entity-name> [OPTIONS]

ARGUMENTS:
  <entity-name>    Name of the entity to calculate hull for (e.g., "ImpactContributor")

OPTIONS:
  -s, --svg <file>              SVG file path (default: "ERD.svg")
  -c, --concavity <number>      Concavity parameter (default: 2, lower = more concave)
  -l, --length-threshold <num>  Length threshold for edge filtering (default: 0)
  -o, --output <format>         Output format: json, text, svg (default: json)
  --curve-type <type>           Curve type: linear, catmull-rom, cardinal, basis, basis-closed (default: catmull-rom)
  --curve-tension <number>      Tension for cardinal curves (0.0-1.0, default: 0.5)
  --curve-alpha <number>        Alpha for Catmull-Rom curves (0.0-1.0, default: 0.5)
  -v, --verbose                 Verbose output
  -h, --help                    Show this help message

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
  svg  - Complete SVG with smooth spline curve overlay
`);
  }

  formatOutput(
    entityName: string,
    points: Point[],
    area: number,
    perimeter: number,
    format: 'json' | 'text' | 'svg',
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

        const splinePath = `<path d="${splineResult.pathData}" fill="${fillColor}" fill-opacity="0.5" stroke="none" data-hull-entity="${entityName}" data-curve-type="${splineConfig.type}"/>`;

        if (!svgContent) {
          return splinePath;
        }

        // Insert the spline path just before the closing </svg> tag
        const closingSvgIndex = svgContent.lastIndexOf('</svg>');
        if (closingSvgIndex === -1) {
          throw new Error('Invalid SVG: missing closing </svg> tag');
        }

        const beforeClosing = svgContent.substring(0, closingSvgIndex);
        const afterClosing = svgContent.substring(closingSvgIndex);

        return `${beforeClosing}<!-- Smooth spline hull for ${entityName} -->
${splinePath}
${afterClosing}`;

      default:
        throw new Error(`Unknown output format: ${format}`);
    }
  }

  async run(args: string[]): Promise<void> {
    try {
      const options = this.parseArguments(args);

      if (options.help) {
        this.showHelp();
        return;
      }

      if (!options.entityName) {
        console.error('Error: Entity name is required');
        console.error('Use --help for usage information');
        process.exit(1);
      }

      // Resolve SVG file path
      const svgPath = resolve(options.svgFile);

      if (!existsSync(svgPath)) {
        console.error(`Error: SVG file not found: ${svgPath}`);
        process.exit(1);
      }

      if (options.verbose) {
        console.error(`Loading SVG file: ${svgPath}`);
        console.error(`Searching for entity: ${options.entityName}`);
        console.error(`Concavity: ${options.concavity}`);
        console.error(`Length threshold: ${options.lengthThreshold}`);
      }

      // Parse SVG and extract points
      const parser = new SVGParser(svgPath);
      const points = parser.extractPointsFromEntityGroup(options.entityName);

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
      const svgContent = options.outputFormat === 'svg' ? readFileSync(svgPath, 'utf-8') : undefined;

      // Create spline configuration
      const splineConfig: SplineConfig = {
        type: options.curveType,
        tension: options.curveTension,
        alpha: options.curveAlpha
      };

      // Output result
      const output = this.formatOutput(
        options.entityName,
        result.points,
        result.area,
        result.perimeter,
        options.outputFormat,
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
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ERDHullCLI();
  cli.run(process.argv.slice(2));
}

export { ERDHullCLI };
