# Product Requirements Prompt (PRP)
## Jekyll Site Content for Impact Evaluators (IE) Model and Visualization

### Introduction/Overview

This feature involves creating comprehensive content for a Jekyll site that
explains and visualizes the abstract model of Impact Evaluators (IEs/MERIters).
The content will serve as both an educational resource and technical reference,
demonstrating how IE models can be used as a foundational tool for R&D across
the impact evaluation space. It emphasizes composability with other projects
like Hypercerts through shared abstract data models and EAS schemas.

### Goals

1. Create a multi-chapter Jekyll site that can be compiled into a single
   academic-style PDF
2. Provide equal emphasis on abstract modeling/visualization and
   composability/reusability themes
3. Generate dynamic, interactive visualizations of the IE model using PlantUML
   and enhanced SVG annotations
4. Define complete technical specifications for EAS schemas with pseudocode
   examples
5. Establish a reference resource for researchers and developers in the IE and
   Hypercerts ecosystems

### User Stories

1. **As a researcher**, I want to understand the semi-formal abstract model of
   IEs through clear visualizations and explanations, so that I can align my
   work with others in the field.

2. **As a developer**, I want to see technical specifications and pseudocode
   for impact claims, measurements, and evaluations, so that I can implement
   compatible systems.

3. **As a project lead**, I want to understand how IE primitives can be
   composed with other projects like Hypercerts, so that I can foster
   symbiotic collaboration.

4. **As a reader**, I want to interact with dynamic visualizations that let me
   explore different aspects of the model, so that I can better understand
   complex relationships.

5. **As an academic**, I want to download a well-formatted PDF of the entire
   content, so that I can share it as a research resource.

### Functional Requirements

1. The system must generate 3-5 initial chapters of content based on
   presentation.adoc and the PlantUML ERD model

2. The system must create PlantUML-based visualizations showing:
   - The complete IE model (ERD.puml)
   - Individual package sections (IE Governance, Impact, Measure, Evaluate,
     Reward)
   - Specific focus combinations as needed

3. The system can request and then utilise enhancements to the existing
   SVG annotation tool at <https://github.com/aspiers/svg-annotator>.
   Potential enhancements and uses include:
   - Interactive tooltips on hover
   - Multiple annotation layers via different YAML files
   - Clickable links to detailed explanations

4. The system must provide complete EAS schema definitions including:

   - Technical specifications for impact claims
   - Technical specifications for measurements
   - Technical specifications for evaluations
   - Pseudocode examples for each

   These should not be auto-generated but instead prior work should be
   manually incorporated.

5. The system must structure content with a very roughly equal balance of text
   and visuals, progressing to interactive diagrams where appropriate.

6. The system must integrate external resources through:

   - Direct quotes from the IE whitepaper
   - Summarized Hypercerts documentation
   - Proper citations and links for further reading

7. The system must enable PDF compilation in academic paper format

8. The system must use PlantUML preprocessing directives (!define, !if,
   !include) to dynamically render subsections from ERD.puml

9. The system must extend the Makefile to support:
   - Generation of multiple annotated versions
   - Subsection rendering targets
   - Jekyll build integration

10. The system must create content that addresses:

    - Benefits of aligning on semi-formal abstract models
    - R&D tool advantages through visualization
    - Composability across projects
    - Common unopinionated base data models

### Non-Goals (Out of Scope)

1. This feature will NOT implement full d3.js interactive visualizations
   (though it should be designed to allow future enhancement)
2. This feature will NOT create production-ready code implementations (only
   pseudocode)
3. This feature will NOT include more than 10 chapters initially
4. This feature will NOT implement real-time collaborative features
5. This feature will NOT create language-specific EAS schema implementations

### Design Considerations

- Use Latin Modern font for consistency with <https://www.researchretreat.org/ierr-2025/>
- Maintain academic paper formatting standards for PDF output
- Aim for SVG diagrams which are responsive and accessible
- Follow Jekyll's standard directory structure for content organization
- Use AsciiDoc format where appropriate to leverage existing presentation.adoc

### Technical Considerations

1. **PlantUML Integration**:
   - Leverage existing Makefile infrastructure
   - Use preprocessing directives for dynamic content generation
   - Maintain ERD.puml as single source of truth

2. **SVG Annotation Tool**:
   - Extend existing svg-annotator functionality as needed
   - Support multiple YAML configuration files
   - Ensure annotations don't break PDF generation

3. **Jekyll Configuration**:
   - Configure for both web and PDF output
   - Set up proper asset pipeline for generated images
   - Implement navigation between chapters

4. **EAS Schema Integration**:
   - Reference Ethereum Attestation Service standards
   - Ensure schemas are extensible for specific use cases
   - Provide clear mapping between abstract model and schemas

### Success Metrics

1. Complete generation of 3-5 chapters covering all key themes
2. Successful PDF compilation in academic format
3. All PlantUML diagrams render correctly with annotations
4. EAS schema specifications include at least 3 pseudocode examples
5. Content effectively integrates material from presentation.adoc, IE
   whitepaper, and Hypercerts documentation
6. Interactive elements (tooltips, links) function correctly in web version

### Open Questions

1. ~Should we prioritize d3.js integration for dynamic SVG interaction in the
   initial release or defer to a future iteration?~ **Deferred to future
   iteration**
2. ~What specific sections of the Evaluate package need individual focus for
   subsection rendering?~ **Decisions deferred - not necessarily just the
   Evaluate section**
3. ~Should the EAS schema pseudocode target a specific language paradigm
   (functional, object-oriented)?~ **Use Solidity data structures as per
   https://docs.attest.org/docs/tutorials/create-a-schema**
4. ~How should version control handle the multiple generated SVG annotation
   variants?~ **Store as separate files**
5. ~What citation style should be used for academic references?~ **Use APA
   style (7th edition)**
6. ~Should chapters be numbered or named thematically?~ **Both - use numbered
   chapters with thematic names**
7. ~What level of detail is needed for the Hypercerts integration examples?~
   **User will write these - do not auto-generate or guess**
