package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.eyevora.backend.entity.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
}