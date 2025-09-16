package com.mpiaseczny.order_service.service;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import com.mpiaseczny.order_service.dto.CreateOrderRequest;
import com.mpiaseczny.order_service.dto.OrderCreatedEvent;
import com.mpiaseczny.order_service.dto.OrderStatusChangedEvent;
import com.mpiaseczny.order_service.entity.Order;
import com.mpiaseczny.order_service.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String ORDER_CREATED_TOPIC = "order-created";

    private static final String ORDER_STATUS_CHANGED_TOPIC = "order-status-changed";

    public List<Order> getOrders(Long userId, boolean activeOnly) {
        if (activeOnly) {
            List<OrderStatus> activeStatuses = List.of(
                    OrderStatus.PENDING,
                    OrderStatus.CONFIRMED,
                    OrderStatus.PROCESSING,
                    OrderStatus.SHIPPED
            );

            return orderRepository.findByCreatedByIdAndStatusInOrderByCreatedAtDesc(userId, activeStatuses);
        }

        return orderRepository.findByCreatedByIdOrderByCreatedAtDesc(userId);
    }

    public Order createOrder(Long userId, CreateOrderRequest request) {
        Order order = new Order(
                userId,
                request.getCustomerId(),
                request.getDescription()
        );

        Order savedOrder = orderRepository.save(order);

        OrderCreatedEvent event = new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCreatedAt(),
                savedOrder.getStatus(),
                savedOrder.getCreatedById(),
                savedOrder.getCustomerId(),
                savedOrder.getDescription()
        );

        kafkaTemplate.send(ORDER_CREATED_TOPIC, event);

        return savedOrder;
    }

    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                order.getId(),
                order.getStatus(),
                status
        );

        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);

        kafkaTemplate.send(ORDER_STATUS_CHANGED_TOPIC, event);

        return savedOrder;
    }
}
