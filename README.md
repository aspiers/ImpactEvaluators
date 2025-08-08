# Impact Evaluator (IE) Research

Research on Generalized Impact Evaluator systems, building on the [Protocol
Labs research framework](https://research.protocol.ai/publications/generalized-impact-evaluators/).

## Overview

This research explores modular systems for coordinating work by measuring,
evaluating, and retrospectively rewarding impact achieved towards specified
valuable objectives.

Currently includes Entity Relationship Diagram modeling for core system
architecture design.

**📊 [View ERD Diagram](diagrams/ERD.png)**

### Key Components

- **Governance**: ObjectivesDesigner, ScopesDesigner, MeasurementDesigner,
  EvaluationDesigner, Treasury
- **Impact Tracking**: ImpactOrganization → ImpactProject → ImpactScope →
  ImpactClaim + ImpactContributor
- **Measurement**: Measurer taking Measurements of ImpactClaims
- **Evaluation**: Evaluator performing Evaluations of Measurements
- **Rewards**: RewardCalculator → RewardAllocation → PayoutProcessor →
  ImpactContributor

## Current Research Phase

The research currently focuses on system architecture design and modeling:

### Generate ERD Diagrams

```bash
make all          # Generate PNG and SVG from all .puml files
make clean        # Remove generated PNG and SVG files
make watch        # Auto-regenerate on file changes (requires inotify-tools)
make areas        # Generate ERD-areas.svg with focus area annotations
make help         # Show available commands
```

### Jekyll Site Development

This repository also contains a Jekyll site for presenting the research:

```bash
# CSS and JavaScript compilation
npm run build:css    # Compile SCSS to CSS
npm run build:js     # Compile and minify JavaScript
npm run build        # Build both CSS and JS

# Site building
./copy-sass.sh       # Copy _sass to _site for sourcemap support
bundle exec jekyll build  # Build the complete Jekyll site
bundle exec jekyll serve  # Serve site locally for development
```


## Requirements

### For ERD Diagrams
- PlantUML installed and available in PATH
- Make
- [svg-annotator](https://github.com/aspiers/svg-annotator) tool (for focus area annotations)

### For Jekyll Site
- Ruby with Bundler
- Node.js with npm
- Jekyll and site dependencies (install with `bundle install`)
- Node dependencies (install with `npm install`)

## Project Structure

```
IE/
├── ERD.puml     # PlantUML source for research architecture model
├── Makefile     # Build system for generating diagrams
├── README.md    # Project documentation
└── ERD.png      # Generated research model diagram
```

*Note: Additional research components and analysis will be added as the
research develops.*
