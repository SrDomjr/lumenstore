package com.lumenstore.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponseDTO {
    private Long id;
    private String token;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String refreshToken;
}