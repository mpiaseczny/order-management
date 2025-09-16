package com.mpiaseczny.notification_service.dto;

import com.mpiaseczny.notification_service.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderCreatedEvent {

    private Long orderId;

    private Instant createdAt;

    private OrderStatus status;

    private Long createdById;

    private Long customerId;

    private String description;
}