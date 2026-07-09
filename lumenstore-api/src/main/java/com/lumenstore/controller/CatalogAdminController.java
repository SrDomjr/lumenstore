package com.lumenstore.controller;

import com.lumenstore.dto.CategoriaResponseDTO;
import com.lumenstore.dto.MarcaResponseDTO;
import com.lumenstore.models.Color;
import com.lumenstore.models.Talla;
import com.lumenstore.repository.*;
import com.lumenstore.services.CatalogoService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/catalog")
@RequiredArgsConstructor
public class CatalogAdminController {

    private final CatalogoService catalogoService;
    private final ICategoriaRepository categoriaRepository;
    private final IMarcaRepository marcaRepository;
    private final IColorRepository colorRepository;
    private final ITallaRepository tallaRepository;

    // ─── Categories CRUD ───────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<CategoriaResponseDTO>> getAllCategories() {
        return ResponseEntity.ok(catalogoService.getActiveCategories());
    }

    @GetMapping("/categories/all")
    public ResponseEntity<List<CategoriaResponseDTO>> getAllCategoriesIncludingInactive() {
        return ResponseEntity.ok(catalogoService.getAllCategories());
    }

    @PostMapping("/categories")
    @Transactional
    public ResponseEntity<CategoriaResponseDTO> createCategory(@Valid @RequestBody CategoryRequest request) {
        var category = com.lumenstore.models.Categoria.builder()
                .name(request.getName())
                .slug(request.getName().toLowerCase()
                        .replaceAll("[^a-z0-9áéíóúñü\\s-]", "")
                        .replaceAll("[\\s]+", "-")
                        .replaceAll("á", "a").replaceAll("é", "e")
                        .replaceAll("í", "i").replaceAll("ó", "o")
                        .replaceAll("ú", "u").replaceAll("ñ", "n")
                        .replaceAll("ü", "u").replaceAll("-+", "-")
                        .replaceAll("^-|-$", ""))
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .isActive(true)
                .sortOrder(0)
                .build();
        category = categoriaRepository.save(category);
        return ResponseEntity.ok(catalogoService.getCategoryById(category.getId()));
    }

    @PutMapping("/categories/{id}")
    @Transactional
    public ResponseEntity<CategoriaResponseDTO> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        var category = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + id));
        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getImageUrl() != null) category.setImageUrl(request.getImageUrl());
        categoriaRepository.save(category);
        return ResponseEntity.ok(catalogoService.getCategoryById(id));
    }

    @DeleteMapping("/categories/{id}")
    @Transactional
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        var category = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + id));
        category.setIsActive(false);
        categoriaRepository.save(category);
        return ResponseEntity.noContent().build();
    }

    // ─── Brands CRUD ───────────────────────────────────────────

    @GetMapping("/brands")
    public ResponseEntity<List<MarcaResponseDTO>> getAllBrands() {
        return ResponseEntity.ok(catalogoService.getActiveBrands());
    }

    @GetMapping("/brands/all")
    public ResponseEntity<List<MarcaResponseDTO>> getAllBrandsIncludingInactive() {
        return ResponseEntity.ok(catalogoService.getAllBrands());
    }

    @PostMapping("/brands")
    @Transactional
    public ResponseEntity<MarcaResponseDTO> createBrand(@Valid @RequestBody BrandRequest request) {
        var brand = com.lumenstore.models.Marca.builder()
                .name(request.getName())
                .slug(request.getName().toLowerCase()
                        .replaceAll("[^a-z0-9áéíóúñü\\s-]", "")
                        .replaceAll("[\\s]+", "-")
                        .replaceAll("á", "a").replaceAll("é", "e")
                        .replaceAll("í", "i").replaceAll("ó", "o")
                        .replaceAll("ú", "u").replaceAll("ñ", "n")
                        .replaceAll("ü", "u").replaceAll("-+", "-")
                        .replaceAll("^-|-$", ""))
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .isActive(true)
                .build();
        brand = marcaRepository.save(brand);
        return ResponseEntity.ok(catalogoService.getBrandById(brand.getId()));
    }

    @PutMapping("/brands/{id}")
    @Transactional
    public ResponseEntity<MarcaResponseDTO> updateBrand(
            @PathVariable Long id,
            @Valid @RequestBody BrandRequest request) {
        var brand = marcaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada con id: " + id));
        if (request.getName() != null) brand.setName(request.getName());
        if (request.getDescription() != null) brand.setDescription(request.getDescription());
        if (request.getLogoUrl() != null) brand.setLogoUrl(request.getLogoUrl());
        marcaRepository.save(brand);
        return ResponseEntity.ok(catalogoService.getBrandById(id));
    }

    @DeleteMapping("/brands/{id}")
    @Transactional
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        var brand = marcaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada con id: " + id));
        brand.setIsActive(false);
        marcaRepository.save(brand);
        return ResponseEntity.noContent().build();
    }

    // ─── Colors CRUD ───────────────────────────────────────────

    @GetMapping("/colors")
    public ResponseEntity<List<Color>> getAllColors() {
        return ResponseEntity.ok(colorRepository.findAllByOrderByNameAsc());
    }

    @PostMapping("/colors")
    @Transactional
    public ResponseEntity<Color> createColor(@Valid @RequestBody ColorRequest request) {
        if (colorRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Ya existe un color con el nombre: " + request.getName());
        }
        Color color = Color.builder()
                .name(request.getName())
                .hexCode(request.getHexCode() != null ? request.getHexCode() : "#000000")
                .build();
        color = colorRepository.save(color);
        return ResponseEntity.ok(color);
    }

    @PutMapping("/colors/{id}")
    @Transactional
    public ResponseEntity<Color> updateColor(
            @PathVariable Long id,
            @Valid @RequestBody ColorRequest request) {
        Color color = colorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Color no encontrado con id: " + id));
        if (request.getName() != null) color.setName(request.getName());
        if (request.getHexCode() != null) color.setHexCode(request.getHexCode());
        color = colorRepository.save(color);
        return ResponseEntity.ok(color);
    }

    @DeleteMapping("/colors/{id}")
    @Transactional
    public ResponseEntity<Void> deleteColor(@PathVariable Long id) {
        colorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Sizes CRUD ────────────────────────────────────────────

    @GetMapping("/sizes")
    public ResponseEntity<List<Talla>> getAllSizes() {
        return ResponseEntity.ok(tallaRepository.findAllByOrderBySortOrderAsc());
    }

    @PostMapping("/sizes")
    @Transactional
    public ResponseEntity<Talla> createSize(@Valid @RequestBody SizeRequest request) {
        Talla size = Talla.builder()
                .name(request.getName())
                .sortOrder(0)
                .build();
        size = tallaRepository.save(size);
        return ResponseEntity.ok(size);
    }

    @PutMapping("/sizes/{id}")
    @Transactional
    public ResponseEntity<Talla> updateSize(
            @PathVariable Long id,
            @Valid @RequestBody SizeRequest request) {
        Talla size = tallaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Talla no encontrada con id: " + id));
        if (request.getName() != null) size.setName(request.getName());
        size = tallaRepository.save(size);
        return ResponseEntity.ok(size);
    }

    @DeleteMapping("/sizes/{id}")
    @Transactional
    public ResponseEntity<Void> deleteSize(@PathVariable Long id) {
        tallaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Request DTOs ──────────────────────────────────────────

    @Data
    public static class CategoryRequest {
        @NotBlank
        private String name;
        private String description;
        private String imageUrl;
    }

    @Data
    public static class BrandRequest {
        @NotBlank
        private String name;
        private String description;
        private String logoUrl;
    }

    @Data
    public static class ColorRequest {
        @NotBlank
        private String name;
        private String hexCode;
    }

    @Data
    public static class SizeRequest {
        @NotBlank
        private String name;
    }
}