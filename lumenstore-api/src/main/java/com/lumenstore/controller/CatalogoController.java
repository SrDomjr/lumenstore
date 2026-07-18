package com.lumenstore.controller;

import java.util.List;

import com.lumenstore.dto.CategoriaResponseDTO;
import com.lumenstore.dto.MarcaResponseDTO;
import com.lumenstore.models.Color;
import com.lumenstore.models.Talla;
import com.lumenstore.repository.IColorRepository;
import com.lumenstore.repository.ITallaRepository;
import com.lumenstore.services.CatalogoService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;
    private final ITallaRepository tallaRepository;
    private final IColorRepository colorRepository;

    @GetMapping("/categories")
    public ResponseEntity<List<CategoriaResponseDTO>> getCategories() {
        return ResponseEntity.ok(catalogoService.getActiveCategories());
    }

    @GetMapping("/categories/tree")
    public ResponseEntity<List<CategoriaResponseDTO>> getCategoryTree() {
        return ResponseEntity.ok(catalogoService.getCategoryTree());
    }

    @GetMapping("/brands")
    public ResponseEntity<List<MarcaResponseDTO>> getBrands() {
        return ResponseEntity.ok(catalogoService.getActiveBrands());
    }

    @GetMapping("/sizes")
    public ResponseEntity<List<Talla>> getSizes() {
        return ResponseEntity.ok(tallaRepository.findAllByOrderBySortOrderAsc());
    }

    @GetMapping("/colors")
    public ResponseEntity<List<Color>> getColors() {
        return ResponseEntity.ok(colorRepository.findAllByOrderByNameAsc());
    }
}
