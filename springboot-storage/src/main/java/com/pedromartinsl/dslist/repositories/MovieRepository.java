package com.pedromartinsl.dslist.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedromartinsl.dslist.entities.Movie;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}   
