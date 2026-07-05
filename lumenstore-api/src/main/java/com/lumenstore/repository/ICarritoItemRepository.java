package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.CarritoItem;

@Repository
public interface ICarritoItemRepository extends JpaRepository<CarritoItem, Long> {
}
