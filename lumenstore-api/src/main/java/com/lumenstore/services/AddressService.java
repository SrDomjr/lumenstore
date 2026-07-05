package com.lumenstore.services;

import com.lumenstore.models.Direccion;
import com.lumenstore.models.Cliente;
import com.lumenstore.repository.IDireccionRepository;
import com.lumenstore.repository.IClienteRepository;
import com.lumenstore.dto.DireccionRequestDTO;
import com.lumenstore.dto.DireccionResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final IDireccionRepository direccionRepository;
    private final IClienteRepository clienteRepository;

    @Transactional
    public Direccion createAddress(Long customerId, DireccionRequestDTO request) {
        Cliente cliente = clienteRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Direccion direccion = Direccion.builder()
                .customer(cliente)
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry() != null ? request.getCountry() : "Peru")
                .addressType(Direccion.AddressType.valueOf(request.getAddressType()))
                .isDefault(request.getIsDefault() != null && request.getIsDefault())
                .build();

        // Si es default, desmarcar otras
        if (direccion.getIsDefault()) {
            direccionRepository.findByCustomerIdAndIsDefaultTrue(customerId)
                    .forEach(d -> {
                        d.setIsDefault(false);
                        direccionRepository.save(d);
                    });
        }

        return direccionRepository.save(direccion);
    }

    @Transactional(readOnly = true)
    public DireccionResponseDTO getAddressById(Long customerId, Long addressId) {
        Direccion direccion = direccionRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        if (!direccion.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Acceso denegado a esta dirección");
        }

        return mapToDTO(direccion);
    }

    @Transactional(readOnly = true)
    public List<DireccionResponseDTO> getAddressesByCustomer(Long customerId) {
        return direccionRepository.findByCustomerId(customerId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public Direccion updateAddress(Long customerId, Long addressId, DireccionRequestDTO request) {
        Direccion direccion = direccionRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        if (!direccion.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Acceso denegado a esta dirección");
        }

        direccion.setStreet(request.getStreet());
        direccion.setCity(request.getCity());
        direccion.setState(request.getState());
        direccion.setPostalCode(request.getPostalCode());
        direccion.setCountry(request.getCountry());
        direccion.setAddressType(Direccion.AddressType.valueOf(request.getAddressType()));

        if (request.getIsDefault() != null && request.getIsDefault()) {
            direccionRepository.findByCustomerIdAndIsDefaultTrue(customerId)
                    .forEach(d -> {
                        d.setIsDefault(false);
                        direccionRepository.save(d);
                    });
            direccion.setIsDefault(true);
        }

        return direccionRepository.save(direccion);
    }

    @Transactional
    public void deleteAddress(Long customerId, Long addressId) {
        Direccion direccion = direccionRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        if (!direccion.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("Acceso denegado a esta dirección");
        }

        direccionRepository.delete(direccion);
    }

    private DireccionResponseDTO mapToDTO(Direccion direccion) {
        return DireccionResponseDTO.builder()
                .id(direccion.getId())
                .street(direccion.getStreet())
                .city(direccion.getCity())
                .state(direccion.getState())
                .postalCode(direccion.getPostalCode())
                .country(direccion.getCountry())
                .addressType(direccion.getAddressType().toString())
                .isDefault(direccion.getIsDefault())
                .createdAt(direccion.getCreatedAt())
                .build();
    }
}
