package com.mpiaseczny.order_service.entity;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "Orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Instant createdAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @NotNull
    private Long createdById;
    
    @NotNull
    private Long customerId;

    private String description;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (status == null) {
            status = OrderStatus.PENDING;
        }
    }
    
    public Order(Long createdById, Long customerId, String description) {
        this.createdById = createdById;
        this.customerId = customerId;
        this.description = description;
        this.status = OrderStatus.PENDING;
    }
}
