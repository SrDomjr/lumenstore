package com.lumenstore.repository;

import com.lumenstore.models.Talla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ITallaRepository extends JpaRepository<Talla, Long> {
    List<Talla> findAllByOrderBySortOrderAsc();
}