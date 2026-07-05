package com.lumenstore.controller;

import java.util.List;

import com.lumenstore.dto.CategoriaResponseDTO;
import com.lumenstore.dto.MarcaResponseDTO;
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

    @GetMapping("/categories")
    public ResponseEntity<List<CategoriaResponseDTO>> getCategories() {
        return ResponseEntity.ok(catalogoService.getActiveCategories());
    }

    @GetMapping("/brands")
    public ResponseEntity<List<MarcaResponseDTO>> getBrands() {
        return ResponseEntity.ok(catalogoService.getActiveBrands());
    }
}
