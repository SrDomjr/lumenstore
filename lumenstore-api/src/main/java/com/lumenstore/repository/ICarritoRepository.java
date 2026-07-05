package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.Carrito;

import java.util.Optional;

@Repository
public interface ICarritoRepository extends JpaRepository<Carrito, Long> {
    Optional<Carrito> findByUserId(Long userId);
}
