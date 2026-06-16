package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.eyevora.backend.entity.ChatSession;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
}