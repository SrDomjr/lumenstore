package com.lumenstore.repository;

import com.lumenstore.models.Color;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IColorRepository extends JpaRepository<Color, Long> {
    List<Color> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}