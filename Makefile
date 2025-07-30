# Makefile for generating PNG from PlantUML files

# Variables
PUML_FILES = $(wildcard *.puml)
PNG_FILES = $(PUML_FILES:.puml=.png)

# Default target
all: $(PNG_FILES)

# Rule to generate PNG from PUML
%.png: %.puml
	@echo "Generating $@ from $<"
	plantuml -tpng -pipe < $< > $@

# Clean generated files
clean:
	@echo "Cleaning generated PNG files..."
	@rm -f $(PNG_FILES)

# Watch for changes and regenerate (requires inotify-tools)
watch:
	@echo "Watching for changes in *.puml files..."
	@while inotifywait -e modify *.puml 2>/dev/null; do \
		$(MAKE) all; \
	done

# Help target
help:
	@echo "Available targets:"
	@echo "  all    - Generate all PNG files from PUML files"
	@echo "  clean  - Remove generated PNG files"
	@echo "  watch  - Watch for changes and auto-regenerate"
	@echo "  help   - Show this help message"

.PHONY: all erd clean watch help
