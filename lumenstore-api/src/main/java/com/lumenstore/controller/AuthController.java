package com.lumenstore.controller;


import com.lumenstore.dto.AuthResponseDTO;
import com.lumenstore.dto.LoginRequestDTO;
import com.lumenstore.dto.RegisterRequestDTO;
import com.lumenstore.models.Usuario;
import com.lumenstore.repository.IUsuarioRepository;
import com.lumenstore.models.Cliente;
import com.lumenstore.services.JwtService;
import com.lumenstore.repository.IClienteRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IUsuarioRepository userRepository;
    private final IClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO request) {
        // 1. Validaciones de duplicados
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Error: El nombre de usuario ya está en uso.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Error: El correo electrónico ya está en uso.");
        }

        // 2. Crear el nuevo Usuario con la contraseña encriptada
        Usuario nuevoUsuario = Usuario.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // ◄ BCrypt en acción
                .isActive(true)
                .isStaff(false)
                .build();

        userRepository.save(nuevoUsuario);

        Cliente nuevoCliente = Cliente.builder()
                .user(nuevoUsuario)
                .firstName(request.getCustomerProfile().getFirstName())
                .lastName(request.getCustomerProfile().getLastName())
                .email(request.getEmail())
                .build();

        clienteRepository.save(nuevoCliente);

        // 3. Generar Token JWT automático tras registrarse
        String token = jwtService.generateToken(nuevoUsuario);

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .id(nuevoUsuario.getId())
                .token(token)
                .username(nuevoUsuario.getUsername())
                .email(nuevoUsuario.getEmail())
                .firstName(nuevoCliente.getFirstName())
                .lastName(nuevoCliente.getLastName())
                .refreshToken("")
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request) {
        // 1. Spring Security se encarga de validar usuario y contraseña automáticamente
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 2. Si las credenciales son correctas, buscamos el usuario para armar el token
        Usuario usuario = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String token = jwtService.generateToken(usuario);

        // 3. Buscar el perfil de cliente asociado
        Cliente cliente = clienteRepository.findByUser(usuario)
                .orElse(null);

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .id(usuario.getId())
                .token(token)
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .firstName(cliente != null ? cliente.getFirstName() : "")
                .lastName(cliente != null ? cliente.getLastName() : "")
                .refreshToken("")
                .build());
    }
}