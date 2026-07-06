package com.lumenstore.controller;


import com.lumenstore.dto.AuthResponseDTO;
import com.lumenstore.dto.ErrorResponseDTO;
import com.lumenstore.dto.LoginRequestDTO;
import com.lumenstore.dto.RegisterRequestDTO;
import com.lumenstore.models.Cliente;
import com.lumenstore.models.Usuario;
import com.lumenstore.repository.IClienteRepository;
import com.lumenstore.repository.IUsuarioRepository;
import com.lumenstore.services.JwtService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IUsuarioRepository userRepository;
    private final IClienteRepository clienteRepository;
        private final com.lumenstore.repository.IRefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO request) {
                // 1. Validaciones de duplicados (una sola consulta)
                var existingOpt = userRepository.findByUsernameOrEmail(request.getUsername(), request.getEmail());
                if (existingOpt.isPresent()) {
                    var existing = existingOpt.get();
                    if (existing.getUsername().equalsIgnoreCase(request.getUsername())) {
                        return ResponseEntity.badRequest().body(
                                new ErrorResponseDTO("El nombre de usuario ya está en uso.",
                                        List.of(new ErrorResponseDTO.FieldErrorDTO("username", "El nombre de usuario ya está en uso."))));
                    }
                    if (existing.getEmail().equalsIgnoreCase(request.getEmail())) {
                        return ResponseEntity.badRequest().body(
                                new ErrorResponseDTO("El correo electrónico ya está en uso.",
                                        List.of(new ErrorResponseDTO.FieldErrorDTO("email", "El correo electrónico ya está en uso."))));
                    }
                }

        // 2. Crear el nuevo Usuario con la contraseña encriptada
        Usuario nuevoUsuario = Usuario.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // ◄ BCrypt en acción
                .isActive(true)
                .isStaff(false)
                .build();

                Cliente nuevoCliente = null;
                try {
                        userRepository.save(nuevoUsuario);

                        nuevoCliente = Cliente.builder()
                                        .user(nuevoUsuario)
                                        .firstName(request.getCustomerProfile().getFirstName())
                                        .lastName(request.getCustomerProfile().getLastName())
                                        .email(request.getEmail())
                                        .build();
                        clienteRepository.save(nuevoCliente);
                } catch (DataIntegrityViolationException ex) {
                        // Unique constraint violated at DB level (race condition)
                        return ResponseEntity.badRequest().body(
                                        new ErrorResponseDTO("El nombre de usuario o correo ya está en uso.", List.of(
                                                        new ErrorResponseDTO.FieldErrorDTO("username", "El nombre de usuario o correo ya está en uso."))));
                }

        // 3. Generar Token JWT automático tras registrarse
        String token = jwtService.generateToken(nuevoUsuario);

        List<String> roles = nuevoUsuario.getRoles() != null
                ? nuevoUsuario.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList())
                : List.of();

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .id(nuevoUsuario.getId())
                .token(token)
                .username(nuevoUsuario.getUsername())
                .email(nuevoUsuario.getEmail())
                .firstName(nuevoCliente != null ? nuevoCliente.getFirstName() : "")
                .lastName(nuevoCliente != null ? nuevoCliente.getLastName() : "")
                .refreshToken("")
                .roles(roles)
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

        List<String> roles = usuario.getRoles() != null
                ? usuario.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList())
                : List.of();

        return ResponseEntity.ok(AuthResponseDTO.builder()
                .id(usuario.getId())
                .token(token)
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .firstName(cliente != null ? cliente.getFirstName() : "")
                .lastName(cliente != null ? cliente.getLastName() : "")
                .refreshToken("")
                .roles(roles)
                .build());
    }

        @PostMapping("/logout")
        public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                                        @RequestBody(required = false) java.util.Map<String, String> body) {
                try {
                        // If refreshToken provided, delete that token
                        if (body != null && body.containsKey("refreshToken")) {
                                String refresh = body.get("refreshToken");
                                refreshTokenRepository.findByToken(refresh).ifPresent(refreshTokenRepository::delete);
                                return ResponseEntity.ok(java.util.Map.of("message", "Sesión cerrada"));
                        }

                        // Otherwise, try to extract username from Bearer token and delete all refresh tokens for user
                        if (authorization != null && authorization.startsWith("Bearer ")) {
                                String token = authorization.substring(7);
                                String username = jwtService.extractUsername(token);
                                userRepository.findByUsername(username).ifPresent(user -> refreshTokenRepository.deleteByUserId(user.getId()));
                                return ResponseEntity.ok(java.util.Map.of("message", "Sesión cerrada"));
                        }

                        return ResponseEntity.badRequest().body(java.util.Map.of("message", "No se proporcionó token de sesión"));
                } catch (Exception ex) {
                        return ResponseEntity.status(500).body(java.util.Map.of("message", "Error al cerrar sesión"));
                }
        }
}