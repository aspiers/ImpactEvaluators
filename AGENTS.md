# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a research repository for Generalized Impact Evaluator systems, containing conceptual ERD modeling (PlantUML) with optional focus area annotations.

## Development Commands

### PlantUML Diagram Generation

```bash
make all          # Generate PNG and SVG from all .puml files
make clean        # Remove generated PNG and SVG files
make watch        # Auto-regenerate on file changes (requires inotify-tools)
make areas        # Generate ERD-areas.svg with focus area annotations
```

### Focus Area Annotations

Focus areas can be added to ERD diagrams using the svg-annotator tool.
Configuration is defined in `focus-areas.yml`.

## Focus Areas System

Focus areas are defined in YAML files (e.g., `focus-areas.yml`) and
allow grouping multiple entities with custom styling:

- Each focus area has a name, color, and list of entity names to include
- Supports optional URLs for clickable areas
- Processed using the svg-annotator tool

## Configuration Files


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
Impact Tracking, Measurement, Evaluation, Rewards).
