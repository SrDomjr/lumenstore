package com.lumenstore.services;

import java.util.List;

import com.lumenstore.dto.CategoriaResponseDTO;
import com.lumenstore.dto.MarcaResponseDTO;

public interface CatalogoService {
    List<CategoriaResponseDTO> getActiveCategories();
    List<MarcaResponseDTO> getActiveBrands();
}
