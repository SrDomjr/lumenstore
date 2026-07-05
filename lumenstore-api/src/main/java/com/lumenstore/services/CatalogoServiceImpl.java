package com.lumenstore.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumenstore.dto.CategoriaResponseDTO;
import com.lumenstore.dto.MarcaResponseDTO;
import com.lumenstore.models.Categoria;
import com.lumenstore.models.Marca;
import com.lumenstore.repository.ICategoriaRepository;
import com.lumenstore.repository.IMarcaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CatalogoServiceImpl implements CatalogoService {

    private final ICategoriaRepository categoriaRepository;
    private final IMarcaRepository marcaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaResponseDTO> getActiveCategories() {
        return categoriaRepository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarcaResponseDTO> getActiveBrands() {
        return marcaRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private CategoriaResponseDTO toDto(Categoria categoria) {
        return CategoriaResponseDTO.builder()
                .id(categoria.getId())
                .name(categoria.getName())
                .slug(categoria.getSlug())
                .imageUrl(categoria.getImageUrl())
                .build();
    }

    private MarcaResponseDTO toDto(Marca marca) {
        return MarcaResponseDTO.builder()
                .id(marca.getId())
                .name(marca.getName())
                .slug(marca.getSlug())
                .logoUrl(marca.getLogoUrl())
                .build();
    }
}
