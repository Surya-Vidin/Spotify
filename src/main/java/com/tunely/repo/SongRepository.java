package com.tunely.repo;

import com.tunely.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SongRepository extends JpaRepository<Song, Long> {

    boolean existsByExternalId(String externalId);

    @Query("select s from Song s where "
            + "(:q = '' or lower(s.title) like lower(concat('%', :q, '%')) "
            + "or lower(s.artist) like lower(concat('%', :q, '%')) "
            + "or lower(s.album) like lower(concat('%', :q, '%'))) "
            + "and (:lang = '' or s.language = :lang) "
            + "and (:liked = false or s.liked = true) "
            + "order by s.id desc")
    List<Song> search(@Param("q") String q, @Param("lang") String lang, @Param("liked") boolean liked);

    @Query("select distinct s.language from Song s where s.language is not null order by s.language")
    List<String> languages();
}
