package com.lumenstore.services;

import java.util.List;
import java.util.Map;
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
    public List<CategoriaResponseDTO> getCategoryTree() {
        List<Categoria> all = categoriaRepository.findByIsActiveTrueOrderBySortOrderAsc();
        Map<Long, List<Categoria>> byParent = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));
        return all.stream()
                .filter(c -> c.getParent() == null)
                .map(root -> toDtoWithChildren(root, byParent))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaResponseDTO> getAllCategories() {
        return categoriaRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoriaResponseDTO getCategoryById(Long id) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + id));
        return toDto(categoria);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarcaResponseDTO> getActiveBrands() {
        return marcaRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toBrandDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarcaResponseDTO> getAllBrands() {
        return marcaRepository.findAll()
                .stream()
                .map(this::toBrandDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MarcaResponseDTO getBrandById(Long id) {
        Marca marca = marcaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marca no encontrada con id: " + id));
        return toBrandDto(marca);
    }

    private CategoriaResponseDTO toDto(Categoria categoria) {
        return CategoriaResponseDTO.builder()
                .id(categoria.getId())
                .name(categoria.getName())
                .slug(categoria.getSlug())
                .description(categoria.getDescription())
                .imageUrl(categoria.getImageUrl())
                .isActive(categoria.getIsActive())
                .parentId(categoria.getParent() != null ? categoria.getParent().getId() : null)
                .sortOrder(categoria.getSortOrder())
                .build();
    }

    private CategoriaResponseDTO toDtoWithChildren(Categoria categoria, Map<Long, List<Categoria>> byParent) {
        CategoriaResponseDTO dto = toDto(categoria);
        List<Categoria> children = byParent.getOrDefault(categoria.getId(), List.of());
        dto.setChildren(children.stream()
                .map(child -> toDtoWithChildren(child, byParent))
                .collect(Collectors.toList()));
        return dto;
    }

    private MarcaResponseDTO toBrandDto(Marca marca) {
        return MarcaResponseDTO.builder()
                .id(marca.getId())
                .name(marca.getName())
                .slug(marca.getSlug())
                .description(marca.getDescription())
                .logoUrl(marca.getLogoUrl())
                .isActive(marca.getIsActive())
                .build();
    }
}