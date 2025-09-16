package com.mpiaseczny.order_service.controller;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import com.mpiaseczny.order_service.dto.CreateOrderRequest;
import com.mpiaseczny.order_service.dto.UpdateOrderRequest;
import com.mpiaseczny.order_service.entity.Order;
import com.mpiaseczny.order_service.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> getOrders(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) boolean activeOnly
    ) {
        List<Order> orders = orderService.getOrders(userId, activeOnly);
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        try {
            Order order = orderService.createOrder(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderRequest updateOrderRequest
    ) {
        try {
            OrderStatus status = updateOrderRequest.getStatus();
            Order updatedOrder = orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(updatedOrder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + updateOrderRequest.getStatus()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
