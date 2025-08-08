# Top-level Makefile for IE project
# Generates book.pdf from book.adoc using asciidoctor-pdf

.PHONY: all book diagrams clean watch help

# Default target
all: book diagrams

# Generate PDF book from AsciiDoc source
book.pdf: book.adoc _chapters/*.adoc
	@echo "Generating book.pdf from book.adoc..."
	bundle exec asciidoctor-pdf book.adoc

# Alias for book.pdf
book: book.pdf

# Generate diagrams (delegate to diagrams/Makefile)
diagrams:
	@echo "Generating diagrams..."
	$(MAKE) -C diagrams all

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	@rm -f book.pdf
	$(MAKE) -C diagrams clean

# Watch for changes and regenerate
watch:
	@echo "Watching for changes in book.adoc and _chapters/*.adoc..."
	@while inotifywait -e modify book.adoc _chapters/*.adoc 2>/dev/null; do \
		$(MAKE) book; \
	done

# Help target
help:
	@echo "Available targets:"
	@echo "  all        - Generate book.pdf and diagrams (default)"
	@echo "  book.adoc  - Generate book.adoc from chapter files"
	@echo "  book       - Generate book.pdf from AsciiDoc source"
	@echo "  diagrams   - Generate all diagrams using diagrams/Makefile"
	@echo "  clean      - Remove generated book.adoc, book.pdf and diagram files"
	@echo "  watch      - Watch for changes and auto-regenerate book"
	@echo "  help       - Show this help message"
