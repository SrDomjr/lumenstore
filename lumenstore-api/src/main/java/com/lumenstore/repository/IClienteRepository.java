package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.Cliente;
import com.lumenstore.models.Usuario;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface IClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByUser(Usuario user);
    Optional<Cliente> findByEmail(String email);

    long countByCreatedAtAfter(LocalDateTime date);

    @Query(value = "SELECT COUNT(*) FROM customers WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)", nativeQuery = true)
    long countYesterdayNewCustomers();
}
