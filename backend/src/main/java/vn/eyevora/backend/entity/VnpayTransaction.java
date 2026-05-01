package vn.eyevora.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vnpay_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VnpayTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "vnp_txn_ref", nullable = false, length = 100)
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 100)
    private String vnpTransactionNo;

    @Column(name = "vnp_amount", precision = 15, scale = 2)
    private BigDecimal vnpAmount;

    @Column(name = "vnp_bank_code", length = 20)
    private String vnpBankCode;

    @Column(name = "vnp_pay_date", length = 14)
    private String vnpPayDate;

    @Column(name = "vnp_response_code", length = 10)
    private String vnpResponseCode;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}