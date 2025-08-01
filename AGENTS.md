# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a research repository for Generalized Impact Evaluator systems, containing both conceptual ERD modeling (PlantUML) and a TypeScript CLI tool for generating visual hull overlays around entity groups in ERD diagrams.

## Development Commands

### PlantUML Diagram Generation

```bash
make all          # Generate PNG and SVG from all .puml files
make clean        # Remove generated PNG and SVG files
make watch        # Auto-regenerate on file changes (requires inotify-tools)
make areas        # Generate ERD-areas.svg with focus area hulls overlay
```

### TypeScript CLI Tool

```bash
# Install dependencies
npm install

# Run the ERD hull calculator directly
npx tsx src/index.ts [entity-names...] [options]

# Generate focus area hulls with YAML configuration
npx tsx src/index.ts --areas focus-areas.yml

# Development commands
npm run dev       # Same as npx tsx src/index.ts
npm start         # Same as npx tsx src/index.ts

# TypeScript compilation check (no build step needed - uses tsx runtime)
npx tsc --noEmit
```

### Common Usage Examples

```bash
# Single entity hull
npx tsx src/index.ts ImpactContributor

# Multiple entities with custom curve
npx tsx src/index.ts Treasury FundingSource --curve-type cardinal --padding 20

# All focus areas from YAML config
npx tsx src/index.ts --areas focus-areas.yml > ERD-areas.svg

# Pattern matching with verbose output
npx tsx src/index.ts "Impact*" --verbose
```

## Architecture Overview

### Core Processing Pipeline

The ERD hull calculator follows this processing flow:

1. **SVG Parsing** (`SVGParser`) - Extracts entities and elements from ERD.svg with bounding box calculations
2. **Hull Calculation** (`HullCalculator`) - Uses concaveman library for concave hull generation around entity groups
3. **Spline Generation** (`SplineGenerator`) - Converts hull points to smooth curves (D3 splines)
4. **Visual Enhancement** (`WatercolorFilters`) - Applies artistic SVG filters for watercolor effects
5. **Text Collision Avoidance** (`TextCollisionDetector`) - Positions focus area labels without overlapping existing elements
6. **SVG Output Generation** - Embeds hulls and labels into existing SVG or generates standalone output

### Key Modules

- **`index.ts`** - CLI entry point with Commander.js interface, orchestrates the entire pipeline
- **`svgParser.ts`** - JSDOM-based SVG parsing, extracts entity groups by `data-entity` attributes
- **`hullCalculator.ts`** - Wrapper for concaveman library, calculates geometric hulls with configurable concavity
- **`splineGenerator.ts`** - D3-shape integration for curve smoothing (Catmull-Rom, Cardinal, B-spline, etc.)
- **`watercolorFilters.ts`** - SVG filter generation for artistic effects (turbulence, displacement)
- **`textCollisionDetector.ts`** - Spiral search algorithm for label positioning to avoid SVG element collisions
- **`focusAreaParser.ts`** - YAML configuration parser for reusable entity groupings with colors/URLs
- **`geometryUtils.ts`** - Geometric calculations (centroids, bounding boxes, collision detection)

### Focus Areas System

Focus areas are defined in YAML files (e.g., `focus-areas.yml`) and
allow grouping multiple entities with custom styling:

- Each focus area has a name, color, and list of entity names to include
- Supports optional URLs for clickable hulls
- Labels are positioned using collision avoidance to prevent overlap with existing SVG elements
- Processing order prioritizes larger areas first for better label placement

### SVG Entity Detection

The tool identifies entities in ERD.svg by looking for `<g>` elements
with `data-entity` attributes. Each entity group's bounding box is
calculated from all contained elements (text, rectangles, paths,
etc.).

### Collision Avoidance Algorithm

Text labels use a spiral search pattern:

- Start at geometric centroid of the hull
- Search in 8 cardinal/ordinal directions at increasing distances (20px increments)
- Maximum search distance of 200px to keep labels reasonably close
- 5px collision buffer around text bounding boxes
- Fallback to centroid if no collision-free position found

## Configuration Files

### TypeScript Configuration

- **`tsconfig.json`** - Configured for ES2020 modules to support import.meta
- **`package.json`** - ES modules with tsx for runtime execution, no build step required

### Focus Areas YAML Format

```yaml
- name: Carlos
  color: pink
  areas:
    - Measurer
    - Measurement
    - Evaluator
- name: Luca
  color: lemonchiffon
  url: https://example.com
  areas:
    - ExternalWorld
    - RewardAllocation
```

## PlantUML ERD Structure

The ERD.puml file defines the conceptual model for Impact Evaluator
systems with entities grouped into logical packages (IE Governance,
Impact Tracking, Measurement, Evaluation, Rewards). The SVG output
contains `data-entity` attributes that the TypeScript tool uses for
hull generation.
