import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { FocusArea } from './types.js';

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
        if (!area.label || typeof area.label !== 'string') {
          throw new Error(`Focus area "${area.name}" must have a "label" field`);
        }
        if (!area.color || typeof area.color !== 'string') {
          throw new Error(`Focus area "${area.name}" must have a "color" field (got: ${JSON.stringify(area.color)})`);
        }
        if (!Array.isArray(area.areas)) {
          throw new Error(`Focus area "${area.name}" must have an "areas" array`);
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
    return focusArea.color;
  }

  static listAvailableFocusAreas(focusAreas: FocusArea[]): string[] {
    return focusAreas.map(area => area.name);
  }
}