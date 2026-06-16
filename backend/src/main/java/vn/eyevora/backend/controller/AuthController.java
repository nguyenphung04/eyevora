package vn.eyevora.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.AuthRequest;
import vn.eyevora.backend.dto.RegisterRequest;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.repository.UserRepository;
import vn.eyevora.backend.security.AuthService;
import vn.eyevora.backend.service.OtpService;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;
import org.springframework.security.authentication.BadCredentialsException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.authenticate(request));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body("Tài khoản hoặc mật khẩu không chính xác!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Tài khoản hoặc mật khẩu không chính xác!");
        }
    }
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String phone = request.get("phone");
        String type = request.get("type");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập Email!");
        }

        if ("REGISTER".equals(type)) {
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body("Email này đã được sử dụng!");
            }
            if (phone != null && !phone.trim().isEmpty() && userRepository.existsByPhone(phone)) {
                return ResponseEntity.badRequest().body("Số điện thoại này đã được sử dụng!");
            }
        } else if ("FORGOT_PASSWORD".equals(type)) {
            if (!userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body("Email này chưa từng đăng ký tài khoản!");
            }
        }

        otpService.generateAndSendOtp(email);
        return ResponseEntity.ok(Map.of("message", "Đã gửi mã xác nhận đến email của bạn!"));
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email này chưa được đăng ký!"));

        if (!otpService.validateOtp(email, otp)) {
            return ResponseEntity.badRequest().body("Mã xác nhận không chính xác hoặc đã hết hạn!");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Khôi phục mật khẩu thành công!"));
    }
}