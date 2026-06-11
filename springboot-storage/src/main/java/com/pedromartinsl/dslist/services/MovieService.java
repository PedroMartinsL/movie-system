package com.pedromartinsl.dslist.services;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import com.pedromartinsl.dslist.dto.MovieDTO;
import com.pedromartinsl.dslist.dto.MovieMinDTO;
import com.pedromartinsl.dslist.entities.Movie;
import com.pedromartinsl.dslist.entities.enums.Genre;
import com.pedromartinsl.dslist.infrastructure.services.StorageService;
import com.pedromartinsl.dslist.repositories.MovieRepository;


@Service
public class MovieService {
    
    @Autowired
	private MovieRepository movieRepository;

    @Autowired
	private StorageService storageService;

	@Transactional(readOnly = true)
	public MovieDTO findById(@PathVariable Long listId) {
		Movie result = movieRepository.findById(listId).get();
		return new MovieDTO(result);
	}
	
	public List<MovieMinDTO> findAll() {
		List<Movie> result = movieRepository.findAll();
		return result.stream().map(MovieMinDTO::new).toList();
	}

	@Transactional
    public MovieDTO createMovie(
        String title,
        Integer year,
        Genre genre,
        String description,
        String languageCode,
        MultipartFile video,
        MultipartFile thumbnail
    ) throws IOException {

        String videoUrl =
            storageService.upload(
                video,
                "videos"
            );

        String thumbnailUrl =
            storageService.upload(
                thumbnail,
                "thumbnails"
            );

        Movie movie = new Movie();

        movie.setTitle(title);
        movie.setLanguageCode(languageCode);
        movie.setYear(year);
        movie.setGenre(genre);
        movie.setDescription(description);

        movie.setVideoUrl(videoUrl);
        movie.setImgUrl(thumbnailUrl);

        Movie saved = movieRepository.save(movie);

        return new MovieDTO(saved);
    }
}
