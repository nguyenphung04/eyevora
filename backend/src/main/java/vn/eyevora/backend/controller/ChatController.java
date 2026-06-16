package vn.eyevora.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.eyevora.backend.dto.ChatResponse;
import vn.eyevora.backend.service.ChatbotService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ChatController {

    private final ChatbotService chatbotService;

    @PostMapping("/guest/message")
    public ResponseEntity<ChatResponse> sendMessage(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        ChatResponse response = chatbotService.processUserMessage(userMessage);
        return ResponseEntity.ok(response);
    }
}