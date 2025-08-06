# Impact Evaluator (IE) Research

Research on Generalized Impact Evaluator systems, building on the [Protocol
Labs research framework](https://research.protocol.ai/publications/generalized-impact-evaluators/).

## Overview

This research explores modular systems for coordinating work by measuring,
evaluating, and retrospectively rewarding impact achieved towards specified
valuable objectives.

Currently includes Entity Relationship Diagram modeling for core system
architecture design.

**📊 [View ERD Diagram](ERD.png)**

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
make all    # Generate PNG from all .puml files
make clean  # Remove generated PNG files
make help   # Show available commands
```


## Requirements

- PlantUML installed and available in PATH
- Make
- [svg-annotator](https://github.com/aspiers/svg-annotator) tool (for
  focus area annotations)

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
