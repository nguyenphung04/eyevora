package vn.eyevora.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class VNPayConfig {
    @Value("${vnpay.payUrl}")
    public static String vnp_PayUrl;
    @Value("${vnpay.returnUrl}")
    public static String vnp_ReturnUrl;
    @Value("${vnpay.tmnCode}")
    public static String vnp_TmnCode;
    @Value("${vnpay.hashSecret}")
    public static String vnp_HashSecret;

    public static String vnp_ApiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";

    public static String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                return null;
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes();
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}