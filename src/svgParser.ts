import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { Point, BoundingBox, SVGElement, EntityGroup } from './types.js';

export class SVGParser {
  private dom: JSDOM;
  private svgElement: Element;

  constructor(svgFilePath: string) {
    const svgContent = readFileSync(svgFilePath, 'utf-8');
    this.dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
    const svg = this.dom.window.document.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG element found in the file');
    }
    this.svgElement = svg;
  }

  /**
   * Find the group element with the specified data-entity attribute
   */
  findEntityGroup(entityName: string): Element | null {
    return this.svgElement.querySelector(`g[data-entity="${entityName}"]`);
  }

  /**
   * Get all elements inside an entity group
   */
  getElementsInGroup(groupElement: Element): SVGElement[] {
    const elements: SVGElement[] = [];
    const allElements = groupElement.querySelectorAll('*');

    for (const element of allElements) {
      const bbox = this.getElementBoundingBox(element);
      if (bbox) {
        elements.push({
          tagName: element.tagName.toLowerCase(),
          attributes: this.getElementAttributes(element),
          bbox
        });
      }
    }

    return elements;
  }

  /**
   * Extract bounding box information from an SVG element
   */
  private getElementBoundingBox(element: Element): BoundingBox | null {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'rect':
        return this.getRectBoundingBox(element);
      case 'circle':
      case 'ellipse':
        return this.getCircleEllipseBoundingBox(element);
      case 'path':
        return this.getPathBoundingBox(element);
      case 'line':
        return this.getLineBoundingBox(element);
      case 'text':
        return this.getTextBoundingBox(element);
      default:
        // For other elements, try to get generic position info
        return this.getGenericBoundingBox(element);
    }
  }

  private getRectBoundingBox(element: Element): BoundingBox {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');

    return { x, y, width, height };
  }

  private getCircleEllipseBoundingBox(element: Element): BoundingBox {
    if (element.tagName.toLowerCase() === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const r = parseFloat(element.getAttribute('r') || '0');

      return {
        x: cx - r,
        y: cy - r,
        width: r * 2,
        height: r * 2
      };
    } else {
      // ellipse
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const rx = parseFloat(element.getAttribute('rx') || '0');
      const ry = parseFloat(element.getAttribute('ry') || '0');

      return {
        x: cx - rx,
        y: cy - ry,
        width: rx * 2,
        height: ry * 2
      };
    }
  }

  private getLineBoundingBox(element: Element): BoundingBox {
    const x1 = parseFloat(element.getAttribute('x1') || '0');
    const y1 = parseFloat(element.getAttribute('y1') || '0');
    const x2 = parseFloat(element.getAttribute('x2') || '0');
    const y2 = parseFloat(element.getAttribute('y2') || '0');

    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const maxX = Math.max(x1, x2);
    const maxY = Math.max(y1, y2);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private getTextBoundingBox(element: Element): BoundingBox {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    // Estimate text dimensions (rough approximation)
    const textLength = parseFloat(element.getAttribute('textLength') || '0');
    const fontSize = 14; // Default font size from the SVG

    return {
      x,
      y: y - fontSize,
      width: textLength || (element.textContent?.length || 0) * fontSize * 0.6,
      height: fontSize
    };
  }

  private getPathBoundingBox(element: Element): BoundingBox | null {
    const d = element.getAttribute('d');
    if (!d) return null;

    // Simple path parsing - extract coordinates
    const coords = this.extractPathCoordinates(d);
    if (coords.length === 0) return null;

    const xs = coords.map(p => p.x);
    const ys = coords.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private getGenericBoundingBox(element: Element): BoundingBox | null {
    // Try to extract x, y attributes if they exist
    const x = element.getAttribute('x');
    const y = element.getAttribute('y');

    if (x !== null && y !== null) {
      return {
        x: parseFloat(x),
        y: parseFloat(y),
        width: 0,
        height: 0
      };
    }

    return null;
  }

  private extractPathCoordinates(pathData: string): Point[] {
    const points: Point[] = [];
    // Simple regex to extract numbers (coordinates)
    const numbers = pathData.match(/-?\d+\.?\d*/g);

    if (numbers) {
      for (let i = 0; i < numbers.length - 1; i += 2) {
        points.push({
          x: parseFloat(numbers[i]),
          y: parseFloat(numbers[i + 1])
        });
      }
    }

    return points;
  }

  private getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    return attributes;
  }

  /**
   * Extract all corner points from elements in an entity group
   */
  extractPointsFromEntityGroup(entityName: string): Point[] {
    const group = this.findEntityGroup(entityName);
    if (!group) {
      throw new Error(`Entity group "${entityName}" not found`);
    }

    const elements = this.getElementsInGroup(group);
    const points: Point[] = [];

    for (const element of elements) {
      const bbox = element.bbox;
      // Add all four corners of each element's bounding box
      points.push(
        { x: bbox.x, y: bbox.y },                           // top-left
        { x: bbox.x + bbox.width, y: bbox.y },             // top-right
        { x: bbox.x + bbox.width, y: bbox.y + bbox.height }, // bottom-right
        { x: bbox.x, y: bbox.y + bbox.height }             // bottom-left
      );
    }

    return points;
  }

  /**
   * Extract all corner points from elements in multiple entity groups
   */
  extractPointsFromEntityGroups(entityNames: string[]): Point[] {
    const allPoints: Point[] = [];
    const foundEntities: string[] = [];
    const notFoundEntities: string[] = [];

    for (const entityName of entityNames) {
      // Support wildcard patterns
      if (entityName.includes('*')) {
        const matchingEntities = this.findEntitiesMatchingPattern(entityName);
        if (matchingEntities.length === 0) {
          notFoundEntities.push(entityName);
        } else {
          for (const matchedEntity of matchingEntities) {
            const points = this.extractPointsFromEntityGroup(matchedEntity);
            allPoints.push(...points);
            foundEntities.push(matchedEntity);
          }
        }
      } else {
        try {
          const points = this.extractPointsFromEntityGroup(entityName);
          allPoints.push(...points);
          foundEntities.push(entityName);
        } catch (error) {
          notFoundEntities.push(entityName);
        }
      }
    }

    if (notFoundEntities.length > 0) {
      throw new Error(`Entity groups not found: ${notFoundEntities.join(', ')}`);
    }

    if (allPoints.length === 0) {
      throw new Error('No points found in any of the specified entity groups');
    }

    return allPoints;
  }

  /**
   * Find entities matching a wildcard pattern
   */
  private findEntitiesMatchingPattern(pattern: string): string[] {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
    const allGroups = this.svgElement.querySelectorAll('g[data-entity]');
    const matchingEntities: string[] = [];

    for (const group of allGroups) {
      const entityName = group.getAttribute('data-entity');
      if (entityName && regex.test(entityName)) {
        matchingEntities.push(entityName);
      }
    }

    return matchingEntities;
  }

  /**
   * Get entity group information
   */
  getEntityGroupInfo(entityName: string): EntityGroup {
    const group = this.findEntityGroup(entityName);
    if (!group) {
      throw new Error(`Entity group "${entityName}" not found`);
    }

    const elements = this.getElementsInGroup(group);

    // Calculate overall bounding box
    if (elements.length === 0) {
      throw new Error(`No elements found in entity group "${entityName}"`);
    }

    const allX = elements.flatMap(e => [e.bbox.x, e.bbox.x + e.bbox.width]);
    const allY = elements.flatMap(e => [e.bbox.y, e.bbox.y + e.bbox.height]);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);

    return {
      entityName,
      elements,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    };
  }

  /**
   * Get all text elements from the SVG
   */
  getAllTextElements(): SVGElement[] {
    const textElements: SVGElement[] = [];
    const allTexts = this.svgElement.querySelectorAll('text');

    for (const textElement of allTexts) {
      const bbox = this.getElementBoundingBox(textElement);
      if (bbox) {
        textElements.push({
          tagName: textElement.tagName.toLowerCase(),
          attributes: this.getElementAttributes(textElement),
          bbox
        });
      }
    }

    return textElements;
  }

  /**
   * Get all elements from the SVG (for collision detection)
   */
  getAllElements(): SVGElement[] {
    const elements: SVGElement[] = [];
    const allElements = this.svgElement.querySelectorAll('*');

    for (const element of allElements) {
      // Skip the root SVG element and group containers
      if (element.tagName.toLowerCase() === 'svg' || element.tagName.toLowerCase() === 'g') {
        continue;
      }

      const bbox = this.getElementBoundingBox(element);
      if (bbox) {
        elements.push({
          tagName: element.tagName.toLowerCase(),
          attributes: this.getElementAttributes(element),
          bbox
        });
      }
    }

    return elements;
  }
}
