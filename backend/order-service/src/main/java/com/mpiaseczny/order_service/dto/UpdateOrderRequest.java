package com.mpiaseczny.order_service.dto;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOrderRequest {

    @NotNull
    private OrderStatus status;
}
