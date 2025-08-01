/**
 * Color utilities for converting named colors to hex values
 */

const CSS_NAMED_COLORS: Record<string, string> = {
  // Red colors
  'red': '#FF0000',
  'crimson': '#DC143C',
  'firebrick': '#B22222',
  'darkred': '#8B0000',
  'lightcoral': '#F08080',
  'indianred': '#CD5C5C',
  'salmon': '#FA8072',
  'darksalmon': '#E9967A',
  'lightsalmon': '#FFA07A',
  
  // Pink colors
  'pink': '#FFC0CB',
  'lightpink': '#FFB6C1',
  'hotpink': '#FF69B4',
  'deeppink': '#FF1493',
  'mediumvioletred': '#C71585',
  'palevioletred': '#DB7093',
  
  // Orange colors
  'orange': '#FFA500',
  'darkorange': '#FF8C00',
  'coral': '#FF7F50',
  'tomato': '#FF6347',
  'orangered': '#FF4500',
  'gold': '#FFD700',
  'peachpuff': '#FFDAB9',
  'papayawhip': '#FFEFD5',
  
  // Yellow colors
  'yellow': '#FFFF00',
  'lightyellow': '#FFFFE0',
  'lemonchiffon': '#FFFACD',
  'lightgoldenrodyellow': '#FAFAD2',
  'palegoldenrod': '#EEE8AA',
  'khaki': '#F0E68C',
  'darkkhaki': '#BDB76B',
  
  // Green colors
  'green': '#008000',
  'lime': '#00FF00',
  'limegreen': '#32CD32',
  'lightgreen': '#90EE90',
  'palegreen': '#98FB98',
  'darkgreen': '#006400',
  'forestgreen': '#228B22',
  'seagreen': '#2E8B57',
  'mediumseagreen': '#3CB371',
  'springgreen': '#00FF7F',
  'mediumspringgreen': '#00FA9A',
  'darkseagreen': '#8FBC8F',
  'lightseagreen': '#20B2AA',
  'aquamarine': '#7FFFD4',
  'mediumaquamarine': '#66CDAA',
  
  // Blue colors
  'blue': '#0000FF',
  'lightblue': '#ADD8E6',
  'skyblue': '#87CEEB',
  'lightskyblue': '#87CEFA',
  'deepskyblue': '#00BFFF',
  'dodgerblue': '#1E90FF',
  'cornflowerblue': '#6495ED',
  'steelblue': '#4682B4',
  'lightsteelblue': '#B0C4DE',
  'powderblue': '#B0E0E6',
  'cadetblue': '#5F9EA0',
  'azure': '#F0FFFF',
  'lightcyan': '#E0FFFF',
  'paleturquoise': '#AFEEEE',
  'aqua': '#00FFFF',
  'cyan': '#00FFFF',
  'darkturquoise': '#00CED1',
  'darkslategray': '#2F4F4F',
  'darkcyan': '#008B8B',
  'teal': '#008080',
  'darkblue': '#00008B',
  'navy': '#000080',
  'midnightblue': '#191970',
  
  // Purple colors
  'purple': '#800080',
  'violet': '#EE82EE',
  'plum': '#DDA0DD',
  'magenta': '#FF00FF',
  'orchid': '#DA70D6',
  'mediumorchid': '#BA55D3',
  'darkorchid': '#9932CC',
  'darkviolet': '#9400D3',
  'blueviolet': '#8A2BE2',
  'mediumpurple': '#9370DB',
  'mediumslateblue': '#7B68EE',
  'slateblue': '#6A5ACD',
  'darkslateblue': '#483D8B',
  'lavender': '#E6E6FA',
  'ghostwhite': '#F8F8FF',
  'indigo': '#4B0082',
  
  // Brown colors
  'brown': '#A52A2A',
  'maroon': '#800000',
  'saddlebrown': '#8B4513',
  'sienna': '#A0522D',
  'chocolate': '#D2691E',
  'darkgoldenrod': '#B8860B',
  'peru': '#CD853F',
  'rosybrown': '#BC8F8F',
  'goldenrod': '#DAA520',
  'sandybrown': '#F4A460',
  'tan': '#D2B48C',
  'burlywood': '#DEB887',
  'wheat': '#F5DEB3',
  'navajowhite': '#FFDEAD',
  'bisque': '#FFE4C4',
  'blanchedalmond': '#FFEBCD',
  'cornsilk': '#FFF8DC',
  
  // Gray colors
  'gray': '#808080',
  'grey': '#808080',
  'dimgray': '#696969',
  'dimgrey': '#696969',
  'lightgray': '#D3D3D3',
  'lightgrey': '#D3D3D3',
  'silver': '#C0C0C0',
  'darkgray': '#A9A9A9',
  'darkgrey': '#A9A9A9',
  'lightslategray': '#778899',
  'lightslategrey': '#778899',
  'slategray': '#708090',
  'slategrey': '#708090',
  'gainsboro': '#DCDCDC',
  'whitesmoke': '#F5F5F5',
  
  // Black and white
  'black': '#000000',
  'white': '#FFFFFF',
  'snow': '#FFFAFA',
  'honeydew': '#F0FFF0',
  'mintcream': '#F5FFFA',
  'aliceblue': '#F0F8FF',
  'lavenderblush': '#FFF0F5',
  'mistyrose': '#FFE4E1',
  'oldlace': '#FDF5E6',
  'linen': '#FAF0E6',
  'antiquewhite': '#FAEBD7',
  'beige': '#F5F5DC',
  'floralwhite': '#FFFAF0',
  'ivory': '#FFFFF0',
  'seashell': '#FFF5EE'
};

export class ColorUtils {
  /**
   * Convert a color string to hex format
   * @param color - Color string (hex, named color, or RGB)
   * @returns Hex color string starting with #
   */
  static toHex(color: string): string {
    // Remove whitespace and convert to lowercase
    const cleanColor = color.trim().toLowerCase();
    
    // If already a hex color, return as-is (with # prefix if missing)
    if (cleanColor.match(/^#?[0-9a-f]{6}$/i)) {
      return cleanColor.startsWith('#') ? cleanColor : `#${cleanColor}`;
    }
    
    // If it's a 3-digit hex, expand to 6 digits
    if (cleanColor.match(/^#?[0-9a-f]{3}$/i)) {
      const hex = cleanColor.replace('#', '');
      const expandedHex = hex.split('').map(char => char + char).join('');
      return `#${expandedHex}`;
    }
    
    // Check if it's a named color
    if (CSS_NAMED_COLORS[cleanColor]) {
      return CSS_NAMED_COLORS[cleanColor];
    }
    
    // If it's an RGB format like "rgb(255, 0, 0)"
    const rgbMatch = cleanColor.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    // If we can't parse it, return the original color or a default
    console.warn(`Unable to parse color "${color}", using as-is`);
    return cleanColor.startsWith('#') ? cleanColor : `#${cleanColor}`;
  }
  
  /**
   * Check if a color string is valid
   * @param color - Color string to validate
   * @returns True if the color is valid
   */
  static isValidColor(color: string): boolean {
    const cleanColor = color.trim().toLowerCase();
    
    // Check hex colors (3 or 6 digits)
    if (cleanColor.match(/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i)) {
      return true;
    }
    
    // Check named colors
    if (CSS_NAMED_COLORS[cleanColor]) {
      return true;
    }
    
    // Check RGB format
    if (cleanColor.match(/rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a list of all supported named colors
   * @returns Array of color names
   */
  static getSupportedColorNames(): string[] {
    return Object.keys(CSS_NAMED_COLORS).sort();
  }
}