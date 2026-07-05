package com.lumenstore.models;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "discount_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "min_purchase", precision = 10, scale = 2)
    private BigDecimal minPurchase = BigDecimal.ZERO;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count")
    private Integer usedCount = 0;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;

    public enum DiscountType {
        percentage, fixed
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        boolean notExpired = (startsAt == null || now.isAfter(startsAt)) && 
                            (endsAt == null || now.isBefore(endsAt));
        boolean notExceeded = usageLimit == null || usedCount < usageLimit;
        return isActive && notExpired && notExceeded;
    }

    public void incrementUsage() {
        if (usedCount == null) {
            usedCount = 0;
        }
        usedCount++;
    }
}
