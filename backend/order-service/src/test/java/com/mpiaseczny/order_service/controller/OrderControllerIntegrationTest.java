package com.mpiaseczny.order_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mpiaseczny.order_service.common.enums.OrderStatus;
import com.mpiaseczny.order_service.dto.CreateOrderRequest;
import com.mpiaseczny.order_service.dto.UpdateOrderRequest;
import com.mpiaseczny.order_service.entity.Order;
import com.mpiaseczny.order_service.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OrderControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    private MockMvc mockMvc;

    private static final Long TEST_USER_ID = 1L;
    private static final Long TEST_CUSTOMER_ID = 100L;
    private static final String TEST_DESCRIPTION = "Test order description";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        orderRepository.deleteAll();
    }

    @Test
    void createOrder_ShouldReturnCreatedOrder() throws Exception {
        // Given
        CreateOrderRequest request = new CreateOrderRequest(TEST_CUSTOMER_ID, TEST_DESCRIPTION);

        // When & Then
        mockMvc.perform(post("/api/orders")
                        .header("X-User-Id", TEST_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.customerId").value(TEST_CUSTOMER_ID))
                .andExpect(jsonPath("$.description").value(TEST_DESCRIPTION))
                .andExpect(jsonPath("$.createdById").value(TEST_USER_ID))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void createOrder_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Given
        CreateOrderRequest request = new CreateOrderRequest(null, "");

        // When & Then
        mockMvc.perform(post("/api/orders")
                        .header("X-User-Id", TEST_USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getOrders_ShouldReturnAllOrdersForUser() throws Exception {
        // Given
        Order pendingOrder = createTestOrder(TEST_USER_ID, OrderStatus.PENDING);
        Order cancelledOrder = createTestOrder(TEST_USER_ID, OrderStatus.CANCELLED);
        Order otherUserOrder = createTestOrder(2L, OrderStatus.PENDING);

        orderRepository.save(pendingOrder);
        orderRepository.save(cancelledOrder);
        orderRepository.save(otherUserOrder);

        // When & Then
        mockMvc.perform(get("/api/orders")
                        .header("X-User-Id", TEST_USER_ID)
                        .param("activeOnly", "false"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].createdById", everyItem(equalTo(TEST_USER_ID.intValue()))));
    }

    @Test
    void getOrders_WithActiveOnlyTrue_ShouldReturnOnlyActiveOrders() throws Exception {
        // Given
        Order pendingOrder = createTestOrder(TEST_USER_ID, OrderStatus.PENDING);
        Order processingOrder = createTestOrder(TEST_USER_ID, OrderStatus.PROCESSING);
        Order cancelledOrder = createTestOrder(TEST_USER_ID, OrderStatus.CANCELLED);

        orderRepository.save(pendingOrder);
        orderRepository.save(processingOrder);
        orderRepository.save(cancelledOrder);

        // When & Then
        mockMvc.perform(get("/api/orders")
                        .header("X-User-Id", TEST_USER_ID)
                        .param("activeOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].status", not(hasItem("CANCELLED"))));
    }

    @Test
    void getOrders_WhenNoOrders_ShouldReturnEmptyList() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/orders")
                        .header("X-User-Id", TEST_USER_ID)
                        .param("activeOnly", "false"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void updateOrderStatus_ShouldReturnUpdatedOrder() throws Exception {
        // Given
        Order order = createTestOrder(TEST_USER_ID, OrderStatus.PENDING);
        Order savedOrder = orderRepository.save(order);

        UpdateOrderRequest updateRequest = new UpdateOrderRequest();
        updateRequest.setStatus(OrderStatus.CONFIRMED);

        // When & Then
        mockMvc.perform(put("/api/orders/{id}/status", savedOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(savedOrder.getId()))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.customerId").value(TEST_CUSTOMER_ID))
                .andExpect(jsonPath("$.description").value(TEST_DESCRIPTION));
    }

    @Test
    void updateOrderStatus_WithNonExistentOrder_ShouldReturnBadRequest() throws Exception {
        // Given
        Long nonExistentOrderId = 999L;
        UpdateOrderRequest updateRequest = new UpdateOrderRequest();
        updateRequest.setStatus(OrderStatus.CONFIRMED);

        // When & Then
        mockMvc.perform(put("/api/orders/{id}/status", nonExistentOrderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateOrderStatus_WithNullStatus_ShouldReturnBadRequest() throws Exception {
        // Given
        Order order = createTestOrder(TEST_USER_ID, OrderStatus.PENDING);
        Order savedOrder = orderRepository.save(order);

        UpdateOrderRequest updateRequest = new UpdateOrderRequest();
        // status is null

        // When & Then
        mockMvc.perform(put("/api/orders/{id}/status", savedOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    private Order createTestOrder(Long userId, OrderStatus status) {
        Order order = new Order(userId, TEST_CUSTOMER_ID, TEST_DESCRIPTION);
        order.setStatus(status);
        order.setCreatedAt(Instant.now());
        return order;
    }
}
