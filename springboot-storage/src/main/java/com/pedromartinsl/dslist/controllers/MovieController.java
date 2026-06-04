package com.pedromartinsl.dslist.controllers;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.pedromartinsl.dslist.dto.MovieDTO;
import com.pedromartinsl.dslist.dto.MovieMinDTO;
import com.pedromartinsl.dslist.entities.enums.Genre;
import com.pedromartinsl.dslist.services.MovieService;

@RestController
@RequestMapping("/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @GetMapping("/{id}")
    public MovieDTO findById(@PathVariable Long id) {
        return movieService.findById(id);
    }

    @GetMapping
    public List<MovieMinDTO> findAll() {
        return movieService.findAll();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MovieDTO createMovie(
            @RequestParam String title,
            @RequestParam Integer year,
            @RequestParam Genre genre,
            @RequestParam String description,
            @RequestParam MultipartFile video,
            @RequestParam MultipartFile thumbnail
    ) throws IOException {

        try {

            System.out.println("Título: " + title);
            System.out.println("Ano: " + year);
            System.out.println("Gênero: " + genre);
            System.out.println("Descrição: " + description);
            System.out.println("Vídeo: " + video.getOriginalFilename());
            System.out.println("Thumbnail: " + thumbnail.getOriginalFilename());

            return movieService.createMovie(
                    title,
                    year,
                    genre,
                    description,
                    video,
                    thumbnail
            );

        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}