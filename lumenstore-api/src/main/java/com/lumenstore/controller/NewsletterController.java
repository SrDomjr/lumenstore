package com.lumenstore.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lumenstore.models.NewsletterSubscriber;
import com.lumenstore.repository.INewsletterSubscriberRepository;

import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final INewsletterSubscriberRepository subscriberRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email es requerido"));
        }
        if (subscriberRepository.existsByEmail(email)) {
            return ResponseEntity.ok(Map.of("message", "Ya estás suscrito"));
        }
        subscriberRepository.save(NewsletterSubscriber.builder().email(email.trim()).build());
        return ResponseEntity.ok(Map.of("message", "Suscripción exitosa"));
    }
}
