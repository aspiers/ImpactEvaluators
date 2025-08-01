# Makefile for generating PNG and SVG from PlantUML files

# Variables
PUML_FILES = $(wildcard *.puml)
PNG_FILES = $(PUML_FILES:.puml=.png)
SVG_FILES = $(PUML_FILES:.puml=.svg)

# Default target
all: $(PNG_FILES) $(SVG_FILES)

# Rule to generate PNG from PUML
%.png: %.puml
	@echo "Generating $@ from $<"
	plantuml -tpng -pipe < $< > $@

# Rule to generate SVG from PUML
%.svg: %.puml
	@echo "Generating $@ from $<"
	plantuml -tsvg -pipe < $< > $@

# Generate focus area hulls SVG
areas:
	@echo "Generating focus area hulls..."
	@npx tsx src/index.ts --areas focus-areas.yml --output svg > ERD-areas.svg
	@echo "Generated ERD-areas.svg with all focus area hulls"

# Clean generated files
clean:
	@echo "Cleaning generated PNG and SVG files..."
	@rm -f $(PNG_FILES) $(SVG_FILES) ERD-areas.svg

# Watch for changes and regenerate (requires inotify-tools)
watch:
	@echo "Watching for changes in *.puml files..."
	@while inotifywait -e modify *.puml 2>/dev/null; do \
		$(MAKE) all; \
	done

# Help target
help:
	@echo "Available targets:"
	@echo "  all    - Generate all PNG and SVG files from PUML files"
	@echo "  areas  - Generate ERD with focus area hulls overlay"
	@echo "  clean  - Remove generated PNG and SVG files"
	@echo "  watch  - Watch for changes and auto-regenerate"
	@echo "  help   - Show this help message"

.PHONY: all areas clean watch help
