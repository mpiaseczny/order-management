package com.mpiaseczny.order_service.dto;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OrderStatusChangedEvent {

    private Long orderId;

    private OrderStatus oldStatus;

    private OrderStatus newStatus;
}
