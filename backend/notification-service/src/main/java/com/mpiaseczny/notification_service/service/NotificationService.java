package com.mpiaseczny.notification_service.service;

import com.mpiaseczny.notification_service.dto.OrderCreatedEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    private static final String ORDER_CREATED_TOPIC = "order-created";

    private static final String ORDER_STATUS_CHANGED_TOPIC = "order-status-changed";

    private final ConcurrentMap<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((ex) -> removeEmitter(userId, emitter));

        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("Connected to notification service"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    public void sendOrderCreatedNotification(OrderCreatedEvent event) {
        sendNotificationToUser(event.getCreatedById(), ORDER_CREATED_TOPIC, event);
    }

    private void sendNotificationToUser(Long userId, String eventName, OrderCreatedEvent data) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name(eventName)
                            .data(data));
                } catch (IOException e) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }
}
