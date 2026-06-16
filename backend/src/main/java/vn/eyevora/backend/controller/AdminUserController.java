package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.service.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsersWithStats());
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        try {
            userService.toggleUserStatus(id);
            return ResponseEntity.ok("Cập nhật trạng thái thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}