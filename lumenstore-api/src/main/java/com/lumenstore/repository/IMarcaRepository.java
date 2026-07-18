package com.lumenstore.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.Marca;

@Repository
public interface IMarcaRepository extends JpaRepository<Marca, Long> {

    List<Marca> findByIsActiveTrueOrderByNameAsc();
    Optional<Marca> findBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);

}
