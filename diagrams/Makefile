# Makefile for generating PNG and SVG from PlantUML files

# Variables
PUML_FILES = $(wildcard *.puml)
PNG_FILES = $(PUML_FILES:.puml=.png)
ANNOTATION_FILES = $(filter-out _config.yml, $(wildcard *.yml))
ANNOTATED_SVG_FILES = $(ANNOTATION_FILES:%.yml=ERD-%.svg)
SVG_FILES = $(PUML_FILES:.puml=.svg) $(ANNOTATED_SVG_FILES)

# Default target
.PHONY: all
all: $(PNG_FILES) $(SVG_FILES)

# Rule to generate PNG from PUML
%.png: %.puml
	@echo "Generating $@ from $<"
	plantuml -tpng -pipe < $< > $@

# Rule to generate SVG from PUML
%.svg: %.puml
	@echo "Generating $@ from $<"
	plantuml -tsvg -pipe < $< > $@

# Generate focus area annotations SVG
ERD-%.svg: %.yml ERD.svg
	@echo "Generating $@ with annotations from $< ..."
	@svg-annotator --areas $< > $@
	@echo "Generated $@ with annotations from $<"

.PHONY: areas
areas: $(ANNOTATED_SVG_FILES)

.PHONY: clean
clean:
	@echo "Cleaning generated PNG and SVG files..."
	@rm -f $(PNG_FILES) $(SVG_FILES) $(ANNOTATED_SVG_FILES)

# Watch for changes and regenerate (requires inotify-tools)
.PHONY: watch
watch:
	@echo "Watching for changes in *.puml files..."
	@while inotifywait -e modify *.puml $(FOCUS_AREAS) 2>/dev/null; do \
		$(MAKE) all; \
	done

.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all    - Generate all PNG and SVG files from PUML files"
	@echo "  areas  - Generate ERD with focus area annotations overlay"
	@echo "  clean  - Remove generated PNG and SVG files"
	@echo "  watch  - Watch for changes and auto-regenerate"
	@echo "  help   - Show this help message"
