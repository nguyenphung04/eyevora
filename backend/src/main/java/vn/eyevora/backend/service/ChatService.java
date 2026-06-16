package vn.eyevora.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.eyevora.backend.dto.ChatResponse;
import vn.eyevora.backend.dto.ProductResponse;
import vn.eyevora.backend.entity.*;
import vn.eyevora.backend.repository.*;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {
    @Value("${gemini.api.key}") private String apiKey;
    @Value("${gemini.api.url}") private String apiUrl;

    private final RestTemplate restTemplate;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final ProductRepository productRepository;

    public ChatResponse processChat(User user, String userMsg, Long sessionId) {
        ChatSession session = (sessionId == null)
                ? sessionRepository.save(ChatSession.builder().user(user).build())
                : sessionRepository.findById(sessionId).orElseThrow();

        messageRepository.save(ChatMessage.builder().session(session).sender(ChatMessage.Sender.USER).message(userMsg).build());

        String instructions = "Bạn là chuyên gia tư vấn kính mắt của Eyevora. " +
                "Nếu khách muốn tìm kính, hãy kết thúc câu trả lời bằng mã: SEARCH_JSON{\"material\":\"...\", \"maxPrice\":...}. " +
                "Nếu không, chỉ cần trả lời thân thiện.";

        String aiResponseRaw = callGeminiAPI(instructions + "\nKhách hàng: " + userMsg);

        List<Product> products = new ArrayList<>();
        String cleanReply = aiResponseRaw;
        if (aiResponseRaw.contains("SEARCH_JSON")) {
            try {
                int index = aiResponseRaw.indexOf("SEARCH_JSON");
                cleanReply = aiResponseRaw.substring(0, index).trim();
                String jsonPart = aiResponseRaw.substring(index + 11);

                products = productRepository.findAll().stream().limit(3).toList();
            } catch (Exception e) { }
        }

        List<ProductResponse> suggestedProducts = products.stream()
                .map(product -> ProductResponse.builder()
                        .id(product.getId())
                        .name(product.getName())
                        .description(product.getDescription())
                        .basePrice(product.getBasePrice())
                        .brand(product.getBrand())
                        .material(product.getMaterial())
                        .imageUrl((product.getProductVariants() != null && !product.getProductVariants().isEmpty())
                                ? product.getProductVariants().get(0).getImages()
                                : null)
                        .build())
                .toList();

        messageRepository.save(ChatMessage.builder().session(session).sender(ChatMessage.Sender.BOT).message(cleanReply).build());

        return ChatResponse.builder()
                .botReply(cleanReply)
                .suggestedProducts(suggestedProducts)
                .sessionId(session.getId())
                .build();
    }

    private String callGeminiAPI(String prompt) {
        String url = apiUrl + "?key=" + apiKey;
        Map<String, Object> body = Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
        try {
            Map response = restTemplate.postForObject(url, body, Map.class);
            List candidates = (List) response.get("candidates");
            Map content = (Map) ((Map) candidates.get(0)).get("content");
            return (String) ((Map) ((List) content.get("parts")).get(0)).get("text");
        } catch (Exception e) { return "Cửa hàng đang bận chút, bạn chờ xíu nhé!"; }
    }
}