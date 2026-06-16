package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.eyevora.backend.service.FileUploadService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = fileUploadService.uploadImage(file);
            return ResponseEntity.ok(Map.of(
                    "message", "Upload ảnh thành công",
                    "imageUrl", imageUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi khi upload ảnh: " + e.getMessage()));
        }
    }
}