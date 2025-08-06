# Context

See [prp.md](./prp.md) for the corresponding Product Requirements Prompt.

# Relevant Files

- `_config.yml` - Jekyll configuration for site structure and PDF compilation
- `Makefile` - Build system for PlantUML diagrams and Jekyll integration
- `ERD.puml` - Source PlantUML diagram for IE model visualization
- `presentation.adoc` - Source content about IE model concepts
- `index.md` - Jekyll site homepage/introduction
- `_includes/navigation.html` - Chapter navigation component
- `_layouts/chapter.html` - Layout template for chapter pages
- `assets/css/main.scss` - Styling for academic formatting
- `_data/chapters.yml` - Chapter metadata and ordering
- `_plugins/plantuml_generator.rb` - Jekyll plugin for PlantUML integration
- `focus-areas.yml` - Annotation configuration for ERD diagrams
- `schemas/` - Directory for EAS schema specifications
- `_chapters/` - Directory containing individual chapter markdown files

# Tasks

- [ ] 1. Set up Jekyll site structure and configuration
  - [ ] 1.1. Initialize Jekyll site with academic paper layout
  - [ ] 1.2. Configure _config.yml for both web and PDF output
  - [ ] 1.3. Create _data/chapters.yml for chapter metadata and ordering
  - [ ] 1.4. Set up _layouts/chapter.html template with Latin Modern font
  - [ ] 1.5. Create _includes/navigation.html for chapter navigation
  - [ ] 1.6. Configure assets/css/main.scss for academic formatting

- [ ] 2. Create PlantUML visualization pipeline
  - [ ] 2.1. Extend Makefile to support Jekyll build integration
  - [ ] 2.2. Create PlantUML preprocessing templates for subsection rendering
  - [ ] 2.3. Implement make targets for individual package sections (IE Governance, Impact, Measure, Evaluate, Reward)
  - [ ] 2.4. Create multiple YAML files for different annotation combinations
  - [ ] 2.5. Generate annotated SVG variants using svg-annotator
  - [ ] 2.6. Create _plugins/plantuml_generator.rb Jekyll plugin for automatic diagram generation

- [ ] 3. Develop chapter content based on presentation.adoc
  - [ ] 3.1. Create Chapter 1: "Introduction - The Need for a Map" (based on Challenges and Solution sections)
  - [ ] 3.2. Create Chapter 2: "The Abstract Model - Entities and Data" (based on Map Structure section)
  - [ ] 3.3. Create Chapter 3: "Impact Claims and Governance" (based on Impact Claims and Governance sections)
  - [ ] 3.4. Create Chapter 4: "Composability and Reusability" (new content on cross-project collaboration)
  - [ ] 3.5. Create Chapter 5: "Implementation Roadmap" (based on Current and Future Work sections)
  - [ ] 3.6. Ensure equal balance of text and visuals in each chapter

- [ ] 4. Implement EAS schema specifications
  - [ ] 4.1. Create schemas/impact-claims.md with Solidity data structures
  - [ ] 4.2. Create schemas/measurements.md with Solidity data structures
  - [ ] 4.3. Create schemas/evaluations.md with Solidity data structures
  - [ ] 4.4. Add pseudocode examples for each schema type
  - [ ] 4.5. Document extensibility patterns for specific use cases
  - [ ] 4.6. Create mapping between abstract model entities and EAS schemas

- [ ] 5. Configure PDF compilation
  - [ ] 5.1. Install and configure jekyll-pdf or similar PDF generation plugin
  - [ ] 5.2. Create PDF-specific layout templates
  - [ ] 5.3. Configure APA citation style (7th edition) for bibliography
  - [ ] 5.4. Set up front matter and table of contents generation
  - [ ] 5.5. Ensure SVG diagrams render correctly in PDF output
  - [ ] 5.6. Test academic paper formatting compliance

- [ ] 6. Integrate external resources and citations
  - [ ] 6.1. Extract and incorporate relevant quotes from IE whitepaper
  - [ ] 6.2. Summarize key Hypercerts documentation concepts
  - [ ] 6.3. Create _data/references.yml for bibliography management
  - [ ] 6.4. Add proper APA citations throughout content
  - [ ] 6.5. Create placeholder sections for user-written Hypercerts examples
  - [ ] 6.6. Add links and footnotes for further reading