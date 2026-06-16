package vn.eyevora.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.eyevora.backend.dto.AuthRequest;
import vn.eyevora.backend.dto.AuthResponse;
import vn.eyevora.backend.dto.RegisterRequest;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.repository.UserRepository;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final vn.eyevora.backend.service.OtpService otpService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }
        if (!otpService.validateOtp(request.getEmail(), request.getOtp())) {
            throw new RuntimeException("Mã xác nhận OTP không chính xác hoặc đã hết hạn!");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng!");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("Đăng ký thành công!")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .phone(savedUser.getPhone())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole().name())
                .build();
    }

    public AuthResponse authenticate(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản hoặc mật khẩu không chính xác!"));
        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản của bạn đã bị khóa do vi phạm chính sách của EYEVORA. Vui lòng liên hệ hỗ trợ!");
        }
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("Đăng nhập thành công!")
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}