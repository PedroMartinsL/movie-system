package com.cine.catalog.services;
import java.util.List;

import org.springframework.stereotype.Service;

import com.cine.catalog.clients.StorageClient;
import com.cine.catalog.clients.SubtitleClient;
import com.cine.catalog.records.MovieDTO;
import com.cine.catalog.records.MovieDetailsDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final StorageClient storageClient;
    private final SubtitleClient subtitleClient;

    public List<MovieDTO> getMovies(String genre, String userLanguage) {

        return storageClient.getByGenre(genre)
                .stream()
                .filter(movie -> movie.language().equalsIgnoreCase(userLanguage))
                .toList();
    }

    public MovieDetailsDTO getMovie(String movieId, String userLanguage) {

        MovieDTO movie = storageClient.getById(movieId);

        List<String> subtitles =
                subtitleClient.getAvailableLanguages(movieId);

        return new MovieDetailsDTO(
                movie,
                userLanguage,
                subtitles
        );
    }

    public String getSubtitle(String movieId, String language) {

        return subtitleClient.getSubtitle(movieId, language);
    }
}