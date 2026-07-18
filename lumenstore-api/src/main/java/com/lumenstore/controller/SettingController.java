package com.lumenstore.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.lumenstore.models.Setting;
import com.lumenstore.repository.ISettingRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingController {

    private final ISettingRepository settingRepository;

    @GetMapping
    public ResponseEntity<Map<String, String>> getAllSettings() {
        List<Setting> settings = settingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (Setting s : settings) {
            map.put(s.getSettingKey(), s.getSettingValue());
        }
        return ResponseEntity.ok(map);
    }

    @GetMapping("/{key}")
    public ResponseEntity<String> getSetting(@PathVariable String key) {
        return settingRepository.findBySettingKey(key)
                .map(s -> ResponseEntity.ok(s.getSettingValue()))
                .orElse(ResponseEntity.notFound().build());
    }
}
