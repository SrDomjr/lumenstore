package com.lumenstore.dto;  
  
import lombok.AllArgsConstructor;  
import lombok.Data;  
import lombok.NoArgsConstructor;  
import java.math.BigDecimal;  
  
@Data  
@AllArgsConstructor  
@NoArgsConstructor  
public class ProductoRequestDTO {  
    private String name;  
    private String slug;  
    private String description;  
    private String shortDescription;  
    private String sku;  
    private Long brandId;  
    private Long categoryId;  
    private BigDecimal basePrice;  
    private Integer stock;  
    private Integer discount;  
    private Boolean featured;  
    private Boolean isActive;  
} 
