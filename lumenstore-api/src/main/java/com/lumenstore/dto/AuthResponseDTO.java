package com.lumenstore.dto;

import lombok.*;
import java.util.List;

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
    private List<String> roles;
}
