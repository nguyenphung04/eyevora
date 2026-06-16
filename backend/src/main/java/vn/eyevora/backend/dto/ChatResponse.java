package vn.eyevora.backend.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatResponse {
    private String botReply;
    private List<ProductResponse> suggestedProducts;
    private Long sessionId;
}