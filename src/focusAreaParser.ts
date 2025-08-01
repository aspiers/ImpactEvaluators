import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { FocusArea } from './types.js';
import { ColorUtils } from './colorUtils.js';

export class FocusAreaParser {
  static parseFocusAreasFile(filePath: string): FocusArea[] {
    try {
      const yamlContent = readFileSync(filePath, 'utf-8');
      const focusAreas = yaml.load(yamlContent) as FocusArea[];

      if (!Array.isArray(focusAreas)) {
        throw new Error('Focus areas file must contain an array of focus area objects');
      }

      // Validate each focus area
      for (let i = 0; i < focusAreas.length; i++) {
        const area = focusAreas[i];
        if (!area.name || typeof area.name !== 'string') {
          throw new Error(`Focus area at index ${i} must have a "name" field`);
        }
        if (!area.color || typeof area.color !== 'string') {
          throw new Error(`Focus area "${area.name}" must have a "color" field (got: ${JSON.stringify(area.color)})`);
        }
        if (!ColorUtils.isValidColor(area.color)) {
          throw new Error(`Focus area "${area.name}" has invalid color "${area.color}". Use hex colors (#FF0000), named colors (red, pink, blue), or RGB format (rgb(255,0,0))`);
        }
        if (!Array.isArray(area.areas)) {
          throw new Error(`Focus area "${area.name}" must have an "areas" array`);
        }
        if (area.url && typeof area.url !== 'string') {
          throw new Error(`Focus area "${area.name}" url field must be a string if provided`);
        }
      }

      return focusAreas;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse focus areas file "${filePath}": ${error.message}`);
      }
      throw new Error(`Failed to parse focus areas file "${filePath}": Unknown error`);
    }
  }

  static getEntitiesForFocusArea(focusAreas: FocusArea[], focusAreaName: string): string[] {
    const focusArea = focusAreas.find(area => area.name === focusAreaName);
    if (!focusArea) {
      throw new Error(`Focus area "${focusAreaName}" not found`);
    }
    return focusArea.areas;
  }

  static getColorForFocusArea(focusAreas: FocusArea[], focusAreaName: string): string {
    const focusArea = focusAreas.find(area => area.name === focusAreaName);
    if (!focusArea) {
      throw new Error(`Focus area "${focusAreaName}" not found`);
    }
    return ColorUtils.toHex(focusArea.color);
  }

  static getUrlForFocusArea(focusAreas: FocusArea[], focusAreaName: string): string | undefined {
    const focusArea = focusAreas.find(area => area.name === focusAreaName);
    if (!focusArea) {
      throw new Error(`Focus area "${focusAreaName}" not found`);
    }
    return focusArea.url;
  }

  static listAvailableFocusAreas(focusAreas: FocusArea[]): string[] {
    return focusAreas.map(area => area.name);
  }
}
