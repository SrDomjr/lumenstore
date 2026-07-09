package com.lumenstore.controller;

import com.lumenstore.models.Usuario;
import com.lumenstore.repository.IUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final IUsuarioRepository usuarioRepository;

    @GetMapping("/users")
    public ResponseEntity<Page<Usuario>> getAllUsers(@PageableDefault(size = 100) Pageable pageable) {
        return ResponseEntity.ok(usuarioRepository.findAll(pageable));
    }
}