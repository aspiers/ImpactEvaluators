# Text Collision Avoidance Implementation Plan

**Goal:** Position focus area name labels to avoid overlapping with existing SVG elements

## Phase 1: Text Collision Detection System

- [ ] **Create TextCollisionDetector class** in `src/textCollisionDetector.ts`
  - [ ] Extract all existing SVG text elements and their bounding boxes
  - [ ] Calculate bounding box for each focus area label (using font-size, font-family, text content)
  - [ ] Implement collision detection between rectangles

- [ ] **Enhance GeometryUtils**
  - [ ] Add `calculateBoundingBox(text, fontSize, fontFamily)` method
  - [ ] Add `rectanglesOverlap(rect1, rect2)` collision detection
  - [ ] Add `findNearestNonCollidingPosition()` with candidate position algorithm

## Phase 2: Smart Label Positioning

- [ ] **Implement Position Candidates Algorithm**
  - [ ] Start with centroid as preferred position
  - [ ] Generate candidate positions in concentric circles around centroid
  - [ ] Try positions at 8 cardinal/ordinal directions at increasing distances
  - [ ] Check each candidate against all existing SVG elements + other focus area labels

- [ ] **Update SVG Generation Logic**
  - [ ] Modify `formatMultipleOutput()` in `src/index.ts`
  - [ ] Use SVGParser to extract existing element bounding boxes
  - [ ] Run collision detection for each label before positioning
  - [ ] Fall back to centroid if no collision-free position found within reasonable distance

## Phase 3: Enhanced Collision Avoidance

- [ ] **Advanced Features** (optional)
  - [ ] Add padding around text labels for better visual separation
  - [ ] Implement label line connectors if text moves far from centroid
  - [ ] Add option to disable collision avoidance via CLI flag
  - [ ] Consider text size reduction as fallback strategy

## Technical Approach

- **Candidate Generation**: Spiral outward from centroid in 8 directions
- **Distance Increments**: 20px steps outward (font-size * 1.4)
- **Max Search Distance**: 200px from centroid to avoid labels getting too far away
- **Collision Buffer**: 5px padding around text bounding boxes
- **Priority Order**: Process focus areas by size (largest first) to give priority to bigger hulls

## Files to Modify

- [ ] `src/geometryUtils.ts` - Add text metrics and collision utilities
- [ ] `src/textCollisionDetector.ts` - New collision detection system
- [ ] `src/index.ts` - Update SVG generation with collision avoidance
- [ ] `src/types.ts` - Add TextBoundingBox interface

## Testing Strategy

- [ ] Test with current 3 focus areas (Carlos, Carl, Luca)
- [ ] Add additional overlapping focus areas to stress-test positioning
- [ ] Verify labels remain readable and reasonably close to their areas
- [ ] Ensure fallback behavior works when no collision-free position exists

## Implementation Notes

**Estimated Complexity:** Medium (2-3 hours implementation)
**Risk Level:** Low (graceful fallback to current centroid positioning)

**Current State:** Focus area labels are positioned at geometric centroids with 36px font size and 0.3 opacity. Three labels currently exist: "Carlos", "Carl", "Luca".
