package com.lumenstore.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lumenstore.models.Banner;
import com.lumenstore.repository.IBannerRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/banners")
@RequiredArgsConstructor
public class BannerController {

    private final IBannerRepository bannerRepository;

    @GetMapping
    public ResponseEntity<List<Banner>> getActiveBanners() {
        return ResponseEntity.ok(bannerRepository.findByIsActiveTrueOrderBySortOrder());
    }

    @GetMapping("/{position}")
    public ResponseEntity<List<Banner>> getBannersByPosition(@PathVariable String position) {
        Banner.Position pos = Banner.Position.valueOf(position);
        return ResponseEntity.ok(bannerRepository.findByPositionAndIsActiveTrueOrderBySortOrder(pos));
    }
}
