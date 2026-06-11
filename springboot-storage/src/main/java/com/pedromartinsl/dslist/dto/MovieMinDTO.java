package com.pedromartinsl.dslist.dto;

import com.pedromartinsl.dslist.entities.Movie;
import com.pedromartinsl.dslist.entities.enums.Genre;

public class MovieMinDTO {

    private Long id;
    private String title;
    private Genre genre;
    private String imgUrl;
    private String languageCode;

    public MovieMinDTO() {
    }

    public MovieMinDTO(Movie entity) {
        this.id = entity.getId();
        this.title = entity.getTitle();
        this.genre = entity.getGenre();
        this.imgUrl = entity.getImgUrl();
        this.languageCode = entity.getLanguageCode();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Genre getGenre() {
        return genre;
    }

    public void setGenre(Genre genre) {
        this.genre = genre;
    }

    public String getImgUrl() {
        return imgUrl;
    }

    public void setImgUrl(String imgUrl) {
        this.imgUrl = imgUrl;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }
}