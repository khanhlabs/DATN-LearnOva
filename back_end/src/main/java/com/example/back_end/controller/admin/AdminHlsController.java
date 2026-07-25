package com.example.back_end.controller.admin;

import com.example.back_end.service.admin.AdminHlsMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learnova/admin/hls-migration")
@RequiredArgsConstructor
public class AdminHlsController {

    private final AdminHlsMigrationService adminHlsMigrationService;

    // TODO: chưa có MediaConvert key, comment tạm để app chạy được. Bỏ comment khi có key.
    // @PostMapping
    // public int migrateLegacyVideosToHls() {
    //     return adminHlsMigrationService.migrateAllPendingLessons();
    // }

}
