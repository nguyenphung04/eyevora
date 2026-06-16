package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.eyevora.backend.dto.ChangePasswordRequest;
import vn.eyevora.backend.dto.UserDto;
import vn.eyevora.backend.entity.User;
import vn.eyevora.backend.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    public List<UserDto> getAllUsersWithStats() {
        return userRepository.getUserStatisticsRaw().stream()
                .map(obj -> {
                    UserDto dto = new UserDto();
                    dto.setId((Long) obj[0]);
                    dto.setFullName((String) obj[1]);
                    dto.setEmail((String) obj[2]);
                    dto.setPhone((String) obj[3]);
                    dto.setIsActive((Boolean) obj[4]);
                    dto.setRole(((User.Role) obj[5]).name());
                    dto.setTotalOrders((Long) obj[6]);
                    dto.setCompletedOrders((Long) obj[7]);
                    dto.setCancelledOrders((Long) obj[8]);
                    dto.setAvgRating(obj[9] != null ? ((Number) obj[9]).doubleValue() : 0.0);
                    return dto;
                }).collect(Collectors.toList());
    }

    public void toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("Không thể khóa tài khoản Quản trị viên!");
        }

        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
    }
}