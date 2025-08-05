# Makefile for generating PNG and SVG from PlantUML files

# Variables
PUML_FILES = $(wildcard *.puml)
PNG_FILES = $(PUML_FILES:.puml=.png)
FOCUS_AREAS = focus-areas.yml
SVG_AREAS = ERD-areas.svg
SVG_FILES = $(PUML_FILES:.puml=.svg) $(SVG_AREAS)

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
$(SVG_AREAS): $(FOCUS_AREAS) ERD.svg
	@echo "Generating focus area annotations..."
	@svg-annotator --areas focus-areas.yml > $@
	@echo "Generated $(SVG_AREAS) with all focus area annotations"

.PHONY: areas
areas: ERD-areas.svg

.PHONY: clean
clean:
	@echo "Cleaning generated PNG and SVG files..."
	@rm -f $(PNG_FILES) $(SVG_FILES) ERD-areas.svg

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
