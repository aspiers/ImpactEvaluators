# Text Collision Avoidance Implementation Plan

**Goal:** Position focus area name labels to avoid overlapping with existing SVG elements

## Phase 1: Text Collision Detection System

- [x] **Create TextCollisionDetector class** in `src/textCollisionDetector.ts`
  - [x] Extract all existing SVG text elements and their bounding boxes
  - [x] Calculate bounding box for each focus area label (using font-size, font-family, text content)
  - [x] Implement collision detection between rectangles

- [x] **Enhance GeometryUtils**
  - [x] Add `calculateBoundingBox(text, fontSize, fontFamily)` method
  - [x] Add `rectanglesOverlap(rect1, rect2)` collision detection
  - [x] Add `findNearestNonCollidingPosition()` with candidate position algorithm

## Phase 2: Smart Label Positioning

- [x] **Implement Position Candidates Algorithm**
  - [x] Start with centroid as preferred position
  - [x] Generate candidate positions in concentric circles around centroid
  - [x] Try positions at 8 cardinal/ordinal directions at increasing distances
  - [x] Check each candidate against all existing SVG elements + other focus area labels

- [x] **Update SVG Generation Logic**
  - [x] Modify `generateSVGOutput()` in `src/index.ts`
  - [x] Use SVGParser to extract existing element bounding boxes
  - [x] Run collision detection for each label before positioning
  - [x] Fall back to centroid if no collision-free position found within reasonable distance

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

- [x] `src/geometryUtils.ts` - Add text metrics and collision utilities
- [x] `src/textCollisionDetector.ts` - New collision detection system
- [x] `src/index.ts` - Update SVG generation with collision avoidance
- [x] `src/types.ts` - Add TextBoundingBox interface
- [x] `src/svgParser.ts` - Add methods to extract all SVG elements for collision detection

## Testing Strategy

Run `make areas` or other `make` targets as appropriate.

- [x] Test with current 3 focus areas (Carlos, Carl, Luca)
- [x] Debug and fix collision detection filtering (was including invalid path bounding boxes)
- [x] Verify labels are now positioned away from existing elements
- [x] Ensure collision detection only considers relevant elements (text, simple shapes)
- [x] Implement scoring system to minimize rather than eliminate collisions
- [x] Optimize label positioning to stay closer to hull centroids (Carlos: 60px, Carl: 40px, Luca: 20px)

## Implementation Notes

**Estimated Complexity:** Medium (2-3 hours implementation) ✅ **COMPLETED**
**Risk Level:** Low (graceful fallback to current centroid positioning)

**Final State:** ✅ **IMPLEMENTATION COMPLETE**
Focus area labels are positioned at geometric centroids with 36px font size and 0.3 opacity. Three labels currently exist: "Carlos", "Carl", "Luca".
- Text collision avoidance system successfully implemented with scoring-based positioning
- Labels positioned to minimize collisions while staying close to hull centroids
- All three labels (Carlos, Carl, Luca) positioned with intelligent collision avoidance

**Key achievements:**
- ✅ Spiral search collision avoidance with distance-based scoring
- ✅ Smart positioning that minimizes rather than eliminates all collisions
- ✅ Hull color integration with d3-color processing for text readability
- ✅ Robust element filtering to avoid problematic SVG path parsing
- ✅ Performance optimization with priority-based processing (largest hulls first)
