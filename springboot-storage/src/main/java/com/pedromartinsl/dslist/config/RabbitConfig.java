package com.pedromartinsl.dslist.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public TopicExchange movieExchange() {
        return new TopicExchange("movie.exchange");
    }

    @Bean
    public Queue movieCreatedQueue() {
        return new Queue("movie.created.queue", true);
    }

    @Bean
    public Binding bindingMovieCreated() {
        return BindingBuilder
                .bind(movieCreatedQueue())
                .to(movieExchange())
                .with("movie.created");
    }
}