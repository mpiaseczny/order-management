package com.mpiaseczny.notification_service.controller;

import com.mpiaseczny.notification_service.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @GetMapping("/subscribe")
    public SseEmitter subscribe(@RequestHeader("X-User-Id") Long userId) {
        return notificationService.subscribe(userId);
    }
}
