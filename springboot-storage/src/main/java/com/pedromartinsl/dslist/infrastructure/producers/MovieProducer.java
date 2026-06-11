package com.pedromartinsl.dslist.infrastructure.producers;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.pedromartinsl.dslist.dto.MovieCreatedEvent;

@Service
public class MovieProducer {

    private final RabbitTemplate rabbitTemplate;

    public MovieProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    private static final String EXCHANGE = "movie.exchange";
    private static final String ROUTING_KEY = "movie.created";

    public void sendMovieCreated(MovieCreatedEvent event) {
        rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, event);
    }
}