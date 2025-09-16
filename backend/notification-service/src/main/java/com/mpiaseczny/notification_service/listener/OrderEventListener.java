package com.mpiaseczny.notification_service.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mpiaseczny.notification_service.dto.OrderCreatedEvent;
import com.mpiaseczny.notification_service.dto.OrderStatusChangedEvent;
import com.mpiaseczny.notification_service.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderEventListener.class);
    
    @Autowired
    private NotificationService notificationService;
    
    @KafkaListener(topics = {"order-created"}, groupId = "notification-service-group")
    public void handleOrderCreatedEvent(String message) {
        try {
            OrderCreatedEvent event = objectMapper().readValue(message, OrderCreatedEvent.class);

            logger.info("Received order created event: Order ID {}, Created By Id: {}",
                    event.getOrderId(), event.getCreatedById());

            try {
                notificationService.sendOrderCreatedNotification(event);
                logger.info("Successfully sent SSE notification for order {}", event.getOrderId());
            } catch (Exception e) {
                logger.error("Error sending SSE notification for order {}: {}",
                        event.getOrderId(), e.getMessage(), e);
            }
        } catch (Exception e) {
            logger.error("Error processing order created event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = {"order-status-changed"}, groupId = "notification-service-group")
    public void handleOrderStatusChangedEvent(String message) {
        try {
            OrderStatusChangedEvent event = objectMapper().readValue(message, OrderStatusChangedEvent.class);

            logger.info("Received order status changed event: Order ID {}",
                    event.getOrderId());
        } catch (Exception e) {
            logger.error("Error processing order status changed event: {}", e.getMessage(), e);
        }
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
