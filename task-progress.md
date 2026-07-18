# Product Management Module - Fix Plan

## Backend Issues

### Critical Bugs

- [ ] **Producto.java**: Missing `basePrice`, `stock`, `discount` fields (only in variants, but DTO expects them)
- [ ] **ProductoServiceImpl.java**: `convertToDTO` hardcodes `discount(0)` - should calculate from discounts
- [ ] **ProductoController.java**: No variant DELETE endpoint (frontend tries to call it)
- [ ] **ProductoController.java**: Missing `@PreAuthorize` security annotations on admin endpoints
- [ ] **ProductoServiceImpl.java**: `uploadImages` doesn't validate product exists first
- [ ] **ProductoServiceImpl.java**: `deleteProduct` soft-deletes product but doesn't deactivate its variants
- [ ] **ProductoServiceImpl.java**: N+1 query problem in `convertToDTO` - loads images per product in loop
- [ ] **ProductoServiceImpl.java**: `getProductVariants` doesn't check if product exists
- [ ] **ProductoRequestDTO.java**: Missing `@NotNull` on required fields for creation context
- [ ] **IProductoRepository.java**: `findByFilters` DISTINCT + LEFT JOIN can cause performance issues

### Improvements

- [ ] **ProductoController.java**: Add variant DELETE endpoint
- [ ] **ProductoController.java**: Add proper validation for image uploads (file type, size)
- [ ] **ProductoServiceImpl.java**: Add transactional boundaries for image operations
- [ ] **ProductoServiceImpl.java**: Add proper error handling for image upload failures
- [ ] **ProductoServiceImpl.java**: Calculate discount from actual discount entities instead of hardcoding 0
- [ ] **ProductoServiceImpl.java**: Add logging for critical operations

## Frontend Issues

### Critical Bugs

- [ ] **products.component.ts**: Loads ALL products with `size=1000` - should use server-side pagination
- [ ] **products.component.ts**: Client-side pagination instead of server-side (performance issue)
- [ ] **product-edit.component.ts**: `loadTags` response mapping is wrong - backend returns `List<String>` but code expects objects
- [ ] **product-edit.component.ts**: `saveVariantsAndFinish` tries DELETE on non-existent endpoint
- [ ] **product.service.ts**: `searchProducts` calls non-existent `/products/search` endpoint
- [ ] **product.service.ts**: `getProductsByBrand` calls non-existent `/products/brand/{id}` endpoint
- [ ] **product.service.ts**: `getProductQuestions` calls non-existent endpoint
- [ ] **product.service.ts**: `askQuestion` calls non-existent endpoint
- [ ] **product.service.ts**: `activeOnly` filter not supported by backend
- [ ] **product-edit.component.ts**: `removeImage` no confirmation before deleting
- [ ] **product-edit.component.ts**: `sendImages` error handling doesn't show user feedback

### Improvements

- [ ] **products.component.ts**: Add proper empty state, loading state, error state
- [ ] **products.component.ts**: Add confirmation for bulk delete
- [ ] **product-edit.component.ts**: Add confirmation for image deletion
- [ ] **product-edit.component.ts**: Fix slug auto-generation to handle edge cases
- [ ] **product-edit.component.ts**: Add proper form dirty state tracking
- [ ] **product-edit.component.ts**: Add unsaved changes warning
- [ ] **product.service.ts**: Remove dead code (non-existent endpoints)
- [ ] **products.component.html**: Fix store URL routing
- [ ] **product-edit.component.html**: Add loading states for image operations
