package com.lumenstore.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults());
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // El orden importa: Spring Security aplica la PRIMERA regla
                // que matchee la petición, así que las restricciones de
                // administración van antes que los "permitAll" genéricos.

                // ─── Administración de catálogo: solo admin / manage_products ───
                // Antes estas rutas solo exigían "authenticated()" (y en el
                // caso de GET /admin, ni siquiera eso: quedaba público por la
                // regla "GET /api/v1/products/** permitAll" de más abajo), por
                // lo que CUALQUIER usuario —incluso anónimo o un cliente
                // normal logueado— podía listar el catálogo completo de admin
                // y crear, editar o eliminar productos, variantes, imágenes,
                // categorías, marcas, colores y tallas.
                .requestMatchers("/api/v1/products/admin").hasAnyAuthority("manage_products", "ROLE_admin")
                .requestMatchers("/api/v1/products/images/cleanup").hasAnyAuthority("manage_products", "ROLE_admin")
                .requestMatchers("/api/v1/admin/**").hasAnyAuthority("manage_products", "ROLE_admin")
                // Crear una reseña es una acción de cualquier cliente logueado,
                // no de administración: se excluye antes de la regla general
                // de escritura sobre /api/v1/products/**.
                .requestMatchers(HttpMethod.POST, "/api/v1/products/reviews").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/products/**").hasAnyAuthority("manage_products", "ROLE_admin")
                .requestMatchers(HttpMethod.PUT, "/api/v1/products/**").hasAnyAuthority("manage_products", "ROLE_admin")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasAnyAuthority("manage_products", "ROLE_admin")

                // ─── Público: catálogo en modo lectura ───
                .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/brands").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/sizes").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/colors").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/banners/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/settings").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/settings/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/newsletter/**").permitAll()
                .requestMatchers("/error").permitAll()

                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) 
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}