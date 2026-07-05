package com.lumenstore.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @Column(name = "voucher_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private VoucherType voucherType;

    @Column(length = 10)
    private String series;

    @Column(nullable = false, length = 20)
    private String number;

    @Column(name = "pdf_url", length = 255)
    private String pdfUrl;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;

    public enum VoucherType {
        boleta, factura, nota_credito
    }
}
