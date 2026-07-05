package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lumenstore.models.Etiqueta;
import java.util.Optional;

@Repository
public interface IEtiquetaRepository extends JpaRepository<Etiqueta, Long> {
    Optional<Etiqueta> findByName(String name);
    Optional<Etiqueta> findBySlug(String slug);
}
