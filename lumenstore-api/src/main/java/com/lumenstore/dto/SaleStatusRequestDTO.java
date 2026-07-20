package com.lumenstore.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleStatusRequestDTO {
    private String status;
    private String reason;
}
