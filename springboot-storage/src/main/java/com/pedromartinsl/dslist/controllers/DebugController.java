package com.pedromartinsl.dslist.controllers;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pedromartinsl.dslist.dto.MovieCreatedEvent;

@RestController
@RequestMapping("/debug")
public class DebugController {

    private final RabbitTemplate rabbitTemplate;

    public DebugController(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    // 🔥 health check simples
    @GetMapping("/ok")
    public ResponseEntity<String> ok() {
        return ResponseEntity.ok("OK - service is alive");
    }

    // 🔥 simular evento RabbitMQ
    @PostMapping("/publish-movie")
    public ResponseEntity<String> publishMovie() {

        MovieCreatedEvent event = new MovieCreatedEvent(
                "123",
                "Matrix",
                "en"
        );

        rabbitTemplate.convertAndSend(
                "movie.exchange",
                "movie.created",
                event
        );

        return ResponseEntity.ok("Event sent to RabbitMQ");
    }

    // 🔥 teste simples de payload
    @PostMapping("/echo")
    public ResponseEntity<String> echo(@RequestBody String body) {
        return ResponseEntity.ok("received: " + body);
    }
}