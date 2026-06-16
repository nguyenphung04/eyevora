package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final EmailService emailService;

    private final Map<String, OtpInfo> otpCache = new ConcurrentHashMap<>();

    private static class OtpInfo {
        String code;
        long expiryTime;
        OtpInfo(String code, long expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }
    }

    public void generateAndSendOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));

        otpCache.put(email, new OtpInfo(otp, System.currentTimeMillis() + 60000));

        emailService.sendOtpEmail(email, otp);
    }

    public boolean validateOtp(String email, String otp) {
        OtpInfo info = otpCache.get(email);
        if (info == null) return false;

        if (System.currentTimeMillis() > info.expiryTime) {
            otpCache.remove(email);
            return false;
        }

        if (info.code.equals(otp)) {
            otpCache.remove(email);
            return true;
        }
        return false;
    }
}