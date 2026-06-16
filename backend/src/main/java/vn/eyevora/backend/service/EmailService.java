package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    @Async
    public void sendOrderConfirmation(String toEmail, String orderCode, String customerName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("eyevora@gmail.com");
            message.setTo(toEmail);
            message.setSubject("EYEVORA - Xác nhận đặt hàng thành công (Mã đơn: " + orderCode + ")");

            String content = "Xin chào " + customerName + ",\n\n"
                    + "Cảm ơn bạn đã tin tưởng và mua sắm tại EYEVORA!\n"
                    + "Đơn hàng của bạn đã được ghi nhận thành công.\n\n"
                    + "Mã đơn hàng của bạn là: " + orderCode + "\n\n"
                    + "Bạn có thể sử dụng mã đơn hàng này cùng với số điện thoại đặt hàng để tra cứu tình trạng vận chuyển tại website của chúng tôi.\n\n"
                    + "Link tra cứu: http://localhost:5173/track-order\n\n"
                    + "Lưu ý: Nếu bạn không thực hiện giao dịch này, vui lòng bỏ qua email này.\n\n"
                    + "Trân trọng,\n"
                    + "Đội ngũ EYEVORA.";

            message.setText(content);
            mailSender.send(message);

            System.out.println("Đã gửi email thành công tới: " + toEmail);
        } catch (Exception e) {
            System.err.println("Lỗi gửi email cho đơn " + orderCode + ": " + e.getMessage());
        }
    }
    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã xác nhận hệ thống EYEVORA");
        message.setText("Xin chào,\n\nMã xác nhận (OTP) của bạn là: " + otpCode + "\n\nMã này có hiệu lực trong vòng 60 giây. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ EYEVORA.");
        mailSender.send(message);
    }
}