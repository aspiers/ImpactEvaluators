# Makefile for generating PNG and SVG from PlantUML files

# Variables
PUML_FILES = $(wildcard *.puml)
PNG_FILES = $(PUML_FILES:.puml=.png)
ANNOTATION_FILES = $(filter-out _config.yml, $(wildcard *.yml))
ANNOTATED_SVG_FILES = $(ANNOTATION_FILES:%.yml=ERD-%.svg)
VISIBLE_PACKAGES = Governance Impact Measure Evaluate Reward
PACKAGE_SVG_FILES = $(addprefix ERD-,$(addsuffix .svg,$(shell echo $(VISIBLE_PACKAGES) | tr A-Z a-z)))
SVG_FILES = $(PUML_FILES:.puml=.svg) $(ANNOTATED_SVG_FILES) $(PACKAGE_SVG_FILES)

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

# Augment the meta file specifically with additional transformation
ERD-focus-areas-meta.svg: focus-areas-meta.yml ERD.svg
	@echo "Generating $@ with annotations from $< ..."
	@svg-annotator --areas $< > $@
	@echo "Applying Meta-MERIter transformation to $@..."
	@sed -i 's/MERIter/Meta-MERIter/g' $@
	@echo "Completed Meta-MERIter transformation for $@"

# Generate individual package ERD files using VISIBLE_PACKAGES variable
# Target-specific variable assignments
ERD-governance.svg: PACKAGE = Governance
ERD-impact.svg: PACKAGE = Impact
ERD-measure.svg: PACKAGE = Measure
ERD-evaluate.svg: PACKAGE = Evaluate
ERD-reward.svg: PACKAGE = Reward

# Pattern rule for package-specific ERD files (only matches the 5 specific packages)
ERD-governance.svg ERD-impact.svg ERD-measure.svg ERD-evaluate.svg ERD-reward.svg: ERD.puml
	@echo "Generating $@ for $(PACKAGE) package..."
	@plantuml -tsvg -DVISIBLE_PACKAGES="$(PACKAGE)" -DSHOW_FIELDS="true" -pipe < $< > $@

# Generate ERD with Impact, Measure, and Evaluation packages only
ERD-impact-measure-evaluate.svg: ERD.puml
	@echo "Generating $@ with Impact, Measure, and Evaluate packages..."
	@plantuml -tsvg -DVISIBLE_PACKAGES="Impact,Measure,Evaluate" -DSHOW_FIELDS="true" -pipe < $< > $@

# Generate ERD with all fields including EAS fields
ERD-EAS.svg: ERD.puml
	@echo "Generating $@ with all fields including EAS fields..."
	@plantuml -tsvg -DSHOW_FIELDS="true" -DSHOW_EAS_FIELDS="true" -D'FULL_TITLE=MERIter EAS Schemas' -pipe < $< > $@

.PHONY: areas
areas: $(ANNOTATED_SVG_FILES)

.PHONY: packages
packages: $(PACKAGE_SVG_FILES)

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
	@echo "  all      - Generate all PNG and SVG files from PUML files"
	@echo "  areas    - Generate ERD with focus area annotations overlay"
	@echo "  packages - Generate individual ERD files for each package"
	@echo "  clean    - Remove generated PNG and SVG files"
	@echo "  watch    - Watch for changes and auto-regenerate"
	@echo "  help     - Show this help message"
