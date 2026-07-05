package com.lumenstore.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequestDTO {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 50)
    private String username;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El formato del correo no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;

    @Valid
    @NotNull(message = "Los datos del perfil de cliente son obligatorios")
    private CustomerProfileDTO customerProfile;

    @Data
    public static class CustomerProfileDTO {
        @NotBlank(message = "El nombre es obligatorio")
        private String firstName;

        @NotBlank(message = "El apellido es obligatorio")
        private String lastName;

        private String phone;
        
        private LocalDate dateOfBirth;
    }
}
