package com.mpiaseczny.notification_service.dto;

import com.mpiaseczny.notification_service.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderStatusChangedEvent {

    private Long orderId;

    private OrderStatus oldStatus;

    private OrderStatus newStatus;
}
