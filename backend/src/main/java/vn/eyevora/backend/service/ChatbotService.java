package vn.eyevora.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.eyevora.backend.dto.ChatResponse;
import vn.eyevora.backend.dto.ProductResponse;
import vn.eyevora.backend.entity.Product;
import vn.eyevora.backend.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ProductRepository productRepository;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public ChatResponse processUserMessage(String userMessage) {
        try {
            // 1. CHUẨN BỊ MẬT LỆNH BỌC THÉP CHO GEMINI
            String prompt = "Bạn là 'Eve', CHUYÊN GIA TƯ VẤN KÍNH MẮT của EYEVORA. Khách nói: '" + userMessage + "'.\n" +
                    "Nhiệm vụ: Trích xuất yêu cầu thành JSON. TUYỆT ĐỐI CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH GÌ THÊM.\n" +
                    "QUY TẮC:\n" +
                    "1. LẠC ĐỀ: Nếu hỏi ngoài lề (toán, code, thời tiết...), gán \"isOutOfScope\": true. Bán kính thì gán false.\n" +
                    "2. KHUÔN MẶT & LỜI VĂN: Tư vấn có tâm vào 'botReply'. TUYỆT ĐỐI KHÔNG ĐẶT CÂU HỎI MỞ ở cuối (VD: 'Bạn có muốn xem không?'). BẮT BUỘC chốt câu bằng lời mời trực tiếp (VD: 'Mời bạn tham khảo các mẫu dưới đây nhé!'). LUẬT ĐIỀN SHAPE (CHỈ ĐIỀN 1 TỪ DUY NHẤT): Khách mặt vuông/chữ điền 'shape' = 'Tròn'. Khách mặt tròn điền 'shape' = 'Vuông'.\n" +
                    "3. GIÁ TIỀN: BẮT BUỘC PHẢI LÀ SỐ NGUYÊN (VD: 500000). Nếu nói chung chung ('rẻ', 'đắt') -> gán null.\n" +
                    "   - 'từ 1 triệu' -> minPrice = 1000000\n" +
                    "   - 'dưới 500 cành' -> maxPrice = 500000\n" +
                    "   - Khoảng '300k đến 600k' -> Gán cả minPrice và maxPrice.\n" +
                    "4. TỪ KHÓA ('keyword'): ĐIỀN tên loại kính (VD: 'kính cận', 'kính râm', 'kính phi công'). Nếu hỏi chung chung, gán null.\n" +
                    "5. BỎ QUA: Tuyệt đối KHÔNG trích xuất màu sắc hay thương hiệu vào 'keyword'.\n" +
                    "TRẢ VỀ DUY NHẤT 1 CHUỖI JSON THEO CẤU TRÚC SAU:\n" +
                    "{\"isOutOfScope\": true/false, \"shape\": \"chuỗi/null\", \"material\": \"chuỗi/null\", \"minPrice\": số nguyên/null, \"maxPrice\": số nguyên/null, \"keyword\": \"chuỗi/null\", \"sortByPrice\": \"DESC\"/\"ASC\"/null, \"botReply\": \"Lời tư vấn...\"}";

            // 2. GỌI API GEMINI
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));

            org.springframework.http.HttpEntity<Map<String, Object>> request = new org.springframework.http.HttpEntity<>(requestBody, headers);
            String url = geminiApiUrl + "?key=" + geminiApiKey;

            String responseStr = restTemplate.postForObject(url, request, String.class);

            // 3. LỌC SẠCH JSON
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseStr);
            String aiJsonText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            int startIndex = aiJsonText.indexOf("{");
            int endIndex = aiJsonText.lastIndexOf("}");
            if (startIndex >= 0 && endIndex >= startIndex) {
                aiJsonText = aiJsonText.substring(startIndex, endIndex + 1);
            } else {
                throw new RuntimeException("AI trả về định dạng không phải JSON");
            }

            JsonNode aiData = mapper.readTree(aiJsonText);

            // 4. LẤY CÁC BIẾN
            boolean isOutOfScope = aiData.has("isOutOfScope") && aiData.get("isOutOfScope").asBoolean(false);
            String shape = aiData.hasNonNull("shape") ? aiData.get("shape").asText() : null;
            String material = aiData.hasNonNull("material") ? aiData.get("material").asText() : null;
            String keyword = aiData.hasNonNull("keyword") ? aiData.get("keyword").asText() : null;
            String sortByPrice = aiData.hasNonNull("sortByPrice") ? aiData.get("sortByPrice").asText() : null;
            String botReply = aiData.hasNonNull("botReply") ? aiData.get("botReply").asText() : "Dạ, EYEVORA gửi bạn một số mẫu tham khảo ạ!";

            BigDecimal minPrice = null;
            BigDecimal maxPrice = null;
            try {
                if (aiData.hasNonNull("minPrice") && !aiData.get("minPrice").asText().equals("null")) {
                    minPrice = new BigDecimal(aiData.get("minPrice").asText().replaceAll("[^0-9]", ""));
                }
                if (aiData.hasNonNull("maxPrice") && !aiData.get("maxPrice").asText().equals("null")) {
                    maxPrice = new BigDecimal(aiData.get("maxPrice").asText().replaceAll("[^0-9]", ""));
                }
            } catch (Exception ignored) { }

            // 4.5. XỬ LÝ SẮP XẾP BẰNG SPRING DATA
            org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.unsorted();
            if ("ASC".equalsIgnoreCase(sortByPrice)) sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "basePrice");
            else if ("DESC".equalsIgnoreCase(sortByPrice)) sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "basePrice");

            // 5. TÌM KIẾM TRONG DATABASE
            List<ProductResponse> suggestedProducts = new java.util.ArrayList<>();

            if (!isOutOfScope) {
                List<Product> matchedProducts = productRepository.findByAiCriteria(shape, material, minPrice, maxPrice, keyword, sort);

                suggestedProducts = matchedProducts.stream().limit(5).map(p -> ProductResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .basePrice(p.getBasePrice())
                        .imageUrl(p.getProductVariants().isEmpty() ? null : p.getProductVariants().get(0).getImages().split(",")[0])
                        .isActive(true)
                        .build()).collect(Collectors.toList());
                if (suggestedProducts.isEmpty()) {
                    botReply = botReply + " \n\n(Dạ tiếc quá, hiện tại trong kho EYEVORA đang tạm hết mẫu kính này, bạn có thể tham khảo thêm các dòng khác nhé!)";
                }
            }

            // 6. TRẢ KẾT QUẢ CHO FRONTEND
            return ChatResponse.builder()
                    .botReply(botReply)
                    .suggestedProducts(suggestedProducts)
                    .build();

        } catch (Exception e) {
            System.err.println("Lỗi AI Bot: " + e.getMessage());
            return ChatResponse.builder()
                    .botReply("Xin lỗi bạn, hệ thống AI của EYEVORA đang xử lý quá nhiều yêu cầu. Bạn vui lòng thử lại sau nhé!")
                    .build();
        }
    }
}