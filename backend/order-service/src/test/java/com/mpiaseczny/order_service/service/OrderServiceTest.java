package com.mpiaseczny.order_service.service;

import com.mpiaseczny.order_service.common.enums.OrderStatus;
import com.mpiaseczny.order_service.dto.CreateOrderRequest;
import com.mpiaseczny.order_service.dto.OrderCreatedEvent;
import com.mpiaseczny.order_service.dto.OrderStatusChangedEvent;
import com.mpiaseczny.order_service.entity.Order;
import com.mpiaseczny.order_service.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private OrderService orderService;

    private Order testOrder;
    private CreateOrderRequest createOrderRequest;
    private final Long userId = 1L;
    private final Long customerId = 100L;
    private final String description = "Test order description";

    @BeforeEach
    void setUp() {
        testOrder = new Order(userId, customerId, description);
        testOrder.setId(1L);
        testOrder.setCreatedAt(Instant.now());
        testOrder.setStatus(OrderStatus.PENDING);

        createOrderRequest = new CreateOrderRequest(customerId, description);
    }

    @Test
    void getOrders_WhenActiveOnlyTrue_ShouldReturnActiveOrders() {
        // Given
        List<Order> expectedOrders = Collections.singletonList(testOrder);
        List<OrderStatus> activeStatuses = List.of(
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED
        );

        when(orderRepository.findByCreatedByIdAndStatusInOrderByCreatedAtDesc(userId, activeStatuses))
                .thenReturn(expectedOrders);

        // When
        List<Order> result = orderService.getOrders(userId, true);

        // Then
        assertEquals(expectedOrders, result);
        verify(orderRepository).findByCreatedByIdAndStatusInOrderByCreatedAtDesc(userId, activeStatuses);
        verify(orderRepository, never()).findByCreatedByIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void getOrders_WhenActiveOnlyFalse_ShouldReturnAllOrders() {
        // Given
        List<Order> expectedOrders = Collections.singletonList(testOrder);
        when(orderRepository.findByCreatedByIdOrderByCreatedAtDesc(userId))
                .thenReturn(expectedOrders);

        // When
        List<Order> result = orderService.getOrders(userId, false);

        // Then
        assertEquals(expectedOrders, result);
        verify(orderRepository).findByCreatedByIdOrderByCreatedAtDesc(userId);
        verify(orderRepository, never()).findByCreatedByIdAndStatusInOrderByCreatedAtDesc(any(), any());
    }

    @Test
    void getOrders_WhenActiveOnlyTrue_ShouldUseCorrectActiveStatuses() {
        // Given
        ArgumentCaptor<List<OrderStatus>> statusCaptor = ArgumentCaptor.forClass(List.class);
        when(orderRepository.findByCreatedByIdAndStatusInOrderByCreatedAtDesc(eq(userId), statusCaptor.capture()))
                .thenReturn(Collections.singletonList(testOrder));

        // When
        orderService.getOrders(userId, true);

        // Then
        List<OrderStatus> capturedStatuses = statusCaptor.getValue();
        assertEquals(4, capturedStatuses.size());
        assertTrue(capturedStatuses.contains(OrderStatus.PENDING));
        assertTrue(capturedStatuses.contains(OrderStatus.CONFIRMED));
        assertTrue(capturedStatuses.contains(OrderStatus.PROCESSING));
        assertTrue(capturedStatuses.contains(OrderStatus.SHIPPED));
        assertFalse(capturedStatuses.contains(OrderStatus.DELIVERED));
        assertFalse(capturedStatuses.contains(OrderStatus.CANCELLED));
    }

    @Test
    void createOrder_ShouldSaveOrderAndSendKafkaEvent() {
        // Given
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        // When
        Order result = orderService.createOrder(userId, createOrderRequest);

        // Then
        assertEquals(testOrder, result);

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        
        Order savedOrder = orderCaptor.getValue();
        assertEquals(userId, savedOrder.getCreatedById());
        assertEquals(customerId, savedOrder.getCustomerId());
        assertEquals(description, savedOrder.getDescription());
        assertEquals(OrderStatus.PENDING, savedOrder.getStatus());

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<OrderCreatedEvent> eventCaptor = ArgumentCaptor.forClass(OrderCreatedEvent.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), eventCaptor.capture());

        assertEquals("order-created", topicCaptor.getValue());
        OrderCreatedEvent event = eventCaptor.getValue();
        assertEquals(testOrder.getId(), event.getOrderId());
        assertEquals(testOrder.getCreatedAt(), event.getCreatedAt());
        assertEquals(testOrder.getStatus(), event.getStatus());
        assertEquals(testOrder.getCreatedById(), event.getCreatedById());
        assertEquals(testOrder.getCustomerId(), event.getCustomerId());
        assertEquals(testOrder.getDescription(), event.getDescription());
    }

    @Test
    void updateOrderStatus_WhenOrderExists_ShouldUpdateStatusAndSendEvent() {
        // Given
        Long orderId = 1L;
        OrderStatus newStatus = OrderStatus.CONFIRMED;
        OrderStatus oldStatus = OrderStatus.PENDING;
        
        testOrder.setStatus(oldStatus);
        Order updatedOrder = new Order(userId, customerId, description);
        updatedOrder.setId(orderId);
        updatedOrder.setStatus(newStatus);
        updatedOrder.setCreatedAt(testOrder.getCreatedAt());

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(testOrder)).thenReturn(updatedOrder);

        // When
        Order result = orderService.updateOrderStatus(orderId, newStatus);

        // Then
        assertEquals(updatedOrder, result);
        assertEquals(newStatus, testOrder.getStatus());

        verify(orderRepository).findById(orderId);
        verify(orderRepository).save(testOrder);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<OrderStatusChangedEvent> eventCaptor = ArgumentCaptor.forClass(OrderStatusChangedEvent.class);
        verify(kafkaTemplate).send(topicCaptor.capture(), eventCaptor.capture());

        assertEquals("order-status-changed", topicCaptor.getValue());
        OrderStatusChangedEvent event = eventCaptor.getValue();
        assertEquals(orderId, event.getOrderId());
        assertEquals(oldStatus, event.getOldStatus());
        assertEquals(newStatus, event.getNewStatus());
    }

    @Test
    void updateOrderStatus_WhenOrderNotFound_ShouldThrowRuntimeException() {
        // Given
        Long orderId = 999L;
        OrderStatus newStatus = OrderStatus.CONFIRMED;

        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> orderService.updateOrderStatus(orderId, newStatus));

        assertEquals("Order not found with id: " + orderId, exception.getMessage());

        verify(orderRepository, never()).save(any());
        verify(kafkaTemplate, never()).send(anyString(), any());
    }

    @Test
    void updateOrderStatus_ShouldSendEventAfterUpdatingStatus() {
        // Given
        Long orderId = 1L;
        OrderStatus newStatus = OrderStatus.SHIPPED;
        OrderStatus oldStatus = OrderStatus.PROCESSING;
        
        testOrder.setStatus(oldStatus);

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(testOrder)).thenReturn(testOrder);

        // When
        orderService.updateOrderStatus(orderId, newStatus);

        // Then
        ArgumentCaptor<OrderStatusChangedEvent> eventCaptor = ArgumentCaptor.forClass(OrderStatusChangedEvent.class);
        verify(kafkaTemplate).send(eq("order-status-changed"), eventCaptor.capture());

        OrderStatusChangedEvent event = eventCaptor.getValue();
        assertEquals(oldStatus, event.getOldStatus());
        assertEquals(newStatus, event.getNewStatus());
    }

    @Test
    void createOrder_ShouldCreateOrderWithCorrectInitialStatus() {
        // Given
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        // When
        orderService.createOrder(userId, createOrderRequest);

        // Then
        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        
        Order createdOrder = orderCaptor.getValue();
        assertEquals(OrderStatus.PENDING, createdOrder.getStatus());
    }

    @Test
    void getOrders_WithEmptyResult_ShouldReturnEmptyList() {
        // Given
        when(orderRepository.findByCreatedByIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        // When
        List<Order> result = orderService.getOrders(userId, false);

        // Then
        assertTrue(result.isEmpty());
        verify(orderRepository).findByCreatedByIdOrderByCreatedAtDesc(userId);
    }
}
