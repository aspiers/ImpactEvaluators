# Impact Evaluator (IE) Research

Research on Generalized Impact Evaluator systems, building on the [Protocol Labs research framework](https://research.protocol.ai/publications/generalized-impact-evaluators/).

## Overview

This research explores modular systems for coordinating work by measuring, evaluating, and retrospectively rewarding impact achieved towards specified valuable objectives.

Currently includes Entity Relationship Diagram modeling for core system architecture design.

**📊 [View ERD Diagram](ERD.png)**

### Key Components

- **Governance**: ObjectivesDesigner, ScopesDesigner, MeasurementDesigner, EvaluationDesigner, Treasury
- **Impact Tracking**: ImpactOrganization → ImpactProject → ImpactScope → ImpactClaim + ImpactContributor
- **Measurement**: Measurer taking Measurements of ImpactClaims
- **Evaluation**: Evaluator performing Evaluations of Measurements
- **Rewards**: RewardCalculator → RewardAllocation → PayoutProcessor → ImpactContributor

## Current Research Phase

The research currently focuses on system architecture design and modeling:

### Generate ERD Diagrams

```bash
make all    # Generate PNG from all .puml files
make clean  # Remove generated PNG files
make help   # Show available commands
```

### ERD Hull Calculator

A TypeScript CLI tool for calculating concave hulls around entity groups in the ERD diagrams:

```bash
# Install dependencies
npm install

# Calculate hull for any entity (e.g., ImpactContributor)
npx tsx src/index.ts ImpactContributor

# Generate text summary
npx tsx src/index.ts Treasury --output text --verbose

# Create SVG with hull overlay for visualization
npx tsx src/index.ts ObjectivesDesigner --output svg > entity-hull.svg
```

**Features:**
- **Concave Hull Calculation**: Uses the `concaveman` library for precise hull generation
- **Multiple Output Formats**: JSON data, text summary, or complete SVG with hull overlay
- **Flexible Parameters**: Adjustable concavity and length threshold for hull shape control
- **Direct TypeScript Execution**: Uses `tsx` for runtime execution without compilation

**Options:**
- `--svg, -s <file>`: SVG file path (default: "ERD.svg")
- `--concavity, -c <number>`: Concavity parameter (default: 2, lower = more concave)
- `--output, -o <format>`: Output format: json, text, svg (default: json)
- `--verbose, -v`: Verbose output with debugging information

## Requirements

- PlantUML installed and available in PATH
- Make
- Node.js and npm (for hull calculator tool)

## Project Structure

```
IE/
├── ERD.puml     # PlantUML source for research architecture model
├── Makefile     # Build system for generating diagrams
├── README.md    # Project documentation
└── ERD.png      # Generated research model diagram
```

*Note: Additional research components and analysis will be added as the research develops.*
