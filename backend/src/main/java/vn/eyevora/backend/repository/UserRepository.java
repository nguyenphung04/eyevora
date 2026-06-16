package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.eyevora.backend.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'USER'")
    Long countTotalCustomers();
    @Query("SELECT u.id, u.fullName, u.email, u.phone, u.isActive, u.role, " +
            "(SELECT COUNT(o) FROM Order o WHERE o.user.id = u.id), " +
            "(SELECT COUNT(o) FROM Order o WHERE o.user.id = u.id AND o.orderStatus = 'COMPLETED'), " +
            "(SELECT COUNT(o) FROM Order o WHERE o.user.id = u.id AND o.orderStatus = 'CANCELLED'), " +
            "(SELECT AVG(r.rating) FROM Review r WHERE r.user.id = u.id) " +
            "FROM User u " +
            "WHERE u.role = 'USER' " +
            "ORDER BY u.id DESC")
    List<Object[]> getUserStatisticsRaw();
}