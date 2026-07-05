package com.lumenstore.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumenstore.models.Cliente;
import com.lumenstore.models.Usuario;

import java.util.Optional;

@Repository
public interface IClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByUser(Usuario user);
    Optional<Cliente> findByEmail(String email);
}
