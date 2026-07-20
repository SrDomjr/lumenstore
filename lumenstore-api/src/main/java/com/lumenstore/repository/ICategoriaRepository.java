package com.lumenstore.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.Categoria;

@Repository
public interface ICategoriaRepository extends JpaRepository<Categoria, Long> {

    @Cacheable("categories")
    List<Categoria> findByIsActiveTrueOrderBySortOrderAsc();
    
    // Buscar por slug (útil para las URLs amigables del Frontend, ej: /categorias/electronica)
    Optional<Categoria> findBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);

}
