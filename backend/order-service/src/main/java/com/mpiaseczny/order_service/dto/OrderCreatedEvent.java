package com.mpiaseczny.order_service.dto;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
public class OrderCreatedEvent {
    
    private Long orderId;

    private Instant createdAt;

    private OrderStatus status;

    private Long createdById;

    private Long customerId;

    private String description;
}
