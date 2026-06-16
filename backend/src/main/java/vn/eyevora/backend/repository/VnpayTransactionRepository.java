package vn.eyevora.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.eyevora.backend.entity.VnpayTransaction;

@Repository
public interface VnpayTransactionRepository extends JpaRepository<VnpayTransaction, Long> {
}