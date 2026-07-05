package com.lumenstore.services;


import com.lumenstore.dto.CarritoItemRequestDTO;
import com.lumenstore.models.Carrito;
import com.lumenstore.models.CarritoItem;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.models.Usuario;
import com.lumenstore.repository.ICarritoRepository;
import com.lumenstore.repository.IUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CarritoService {

    private final ICarritoRepository carritoRepository;
    private final IUsuarioRepository userRepository;
    // Asumimos que tienes este repositorio para buscar las variantes
    // Si se llama diferente en tu proyecto (ej. IProductVariantRepository), cámbialo aquí
    private final com.lumenstore.repository.IProductVariantRepository productVariantRepository; 

    @Transactional
    public Carrito addProductToCart(String username, CarritoItemRequestDTO request) {
        // 1. Buscar al usuario dueño de la petición
        Usuario usuario = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // 2. Buscar o crear el carrito asociado al usuario
        Carrito carrito = carritoRepository.findByUserId(usuario.getId())
                .orElseGet(() -> {
                    Carrito newCarrito = Carrito.builder().user(usuario).build();
                    return carritoRepository.save(newCarrito);
                });

        // 3. Validar que la variante del producto exista
        ProductVariant variant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new RuntimeException("La variante de producto especificada no existe"));

        // 4. Verificar si la variante ya está en el carrito
        Optional<CarritoItem> existingItem = carrito.getItems().stream()
                .filter(item -> item.getProductVariant().getId().equals(variant.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // Si ya existe, acumulamos la nueva cantidad
            CarritoItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            // Si es nuevo, creamos el detalle y lo enlazamos
            CarritoItem newItem = CarritoItem.builder()
                    .cart(carrito)
                    .productVariant(variant)
                    .quantity(request.getQuantity())
                    .build();
            carrito.getItems().add(newItem);
        }

        // 5. Guardar los cambios en cascada
        return carritoRepository.save(carrito);
    }
}