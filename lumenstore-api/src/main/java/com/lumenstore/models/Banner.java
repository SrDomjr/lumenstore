package com.lumenstore.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String subtitle;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "link_url", length = 255)
    private String linkUrl;

    @Column(name = "position")
    @Enumerated(EnumType.STRING)
    private Position position = Position.home_top;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at", updatable = false, insertable = false)
    private LocalDateTime createdAt;

    public enum Position {
        home_top, home_middle, category, sidebar
    }

    public boolean isActive() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && 
               (startsAt == null || now.isAfter(startsAt)) && 
               (endsAt == null || now.isBefore(endsAt));
    }
}
