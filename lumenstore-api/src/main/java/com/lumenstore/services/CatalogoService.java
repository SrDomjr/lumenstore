package com.lumenstore.services;

import java.util.List;

import com.lumenstore.dto.CategoriaResponseDTO;
import com.lumenstore.dto.MarcaResponseDTO;

public interface CatalogoService {
    List<CategoriaResponseDTO> getActiveCategories();
    List<CategoriaResponseDTO> getAllCategories();
    CategoriaResponseDTO getCategoryById(Long id);
    List<MarcaResponseDTO> getActiveBrands();
    List<MarcaResponseDTO> getAllBrands();
    MarcaResponseDTO getBrandById(Long id);
}