#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { SVGParser } from './svgParser.js';
import { HullCalculator } from './hullCalculator.js';
import { Point } from './types.js';

interface CLIOptions {
  entityName: string;
  svgFile: string;
  concavity: number;
  lengthThreshold: number;
  outputFormat: 'json' | 'text' | 'svg';
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
ERD Hull Calculator - Calculate concave hulls for entity groups in SVG files

USAGE:
  erd-hull <entity-name> [OPTIONS]

ARGUMENTS:
  <entity-name>    Name of the entity to calculate hull for (e.g., "ImpactContributor")

OPTIONS:
  -s, --svg <file>              SVG file path (default: "ERD.svg")
  -c, --concavity <number>      Concavity parameter (default: 2, lower = more concave)
  -l, --length-threshold <num>  Length threshold for edge filtering (default: 0)
  -o, --output <format>         Output format: json, text, svg (default: json)
  -v, --verbose                 Verbose output
  -h, --help                    Show this help message

EXAMPLES:
  erd-hull ImpactContributor
  erd-hull ImpactContributor --svg ./diagrams/ERD.svg --concavity 1.5
  erd-hull ObjectivesDesigner --output text --verbose
  erd-hull Treasury --output svg > treasury-hull.svg

OUTPUT FORMATS:
  json - JSON object with hull points, area, and perimeter
  text - Human-readable summary
  svg  - SVG path element representing the hull
`);
  }

  formatOutput(
    entityName: string,
    points: Point[],
    area: number,
    perimeter: number,
    format: 'json' | 'text' | 'svg',
    verbose: boolean,
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
          }
        }, null, 2);

      case 'text':
        let output = `Concave Hull for Entity: ${entityName}\n`;
        output += `=====================================\n`;
        output += `Points: ${points.length}\n`;
        output += `Area: ${area.toFixed(2)} square units\n`;
        output += `Perimeter: ${perimeter.toFixed(2)} units\n`;

        if (verbose) {
          output += `\nHull Points:\n`;
          points.forEach((point, index) => {
            output += `  ${index + 1}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})\n`;
          });
        }
        return output;

      case 'svg':
        const pathData = points.map((point, index) => {
          const command = index === 0 ? 'M' : 'L';
          return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        }).join(' ') + ' Z';

        const hullPath = `<path d="${pathData}" fill="none" stroke="red" stroke-width="2" opacity="0.7" data-hull-entity="${entityName}"/>`;

        if (!svgContent) {
          return hullPath;
        }

        // Insert the hull path just before the closing </svg> tag
        const closingSvgIndex = svgContent.lastIndexOf('</svg>');
        if (closingSvgIndex === -1) {
          throw new Error('Invalid SVG: missing closing </svg> tag');
        }

        const beforeClosing = svgContent.substring(0, closingSvgIndex);
        const afterClosing = svgContent.substring(closingSvgIndex);

        return `${beforeClosing}<!-- Hull for ${entityName} -->
${hullPath}
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

      // Output result
      const output = this.formatOutput(
        options.entityName,
        result.points,
        result.area,
        result.perimeter,
        options.outputFormat,
        options.verbose,
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
