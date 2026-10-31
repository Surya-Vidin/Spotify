package com.tunely.web;

import com.tunely.model.Playlist;
import com.tunely.model.Song;
import com.tunely.repo.PlaylistRepository;
import com.tunely.repo.SongRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    public record PlaylistRequest(String name, String description) {}

    private final PlaylistRepository playlists;
    private final SongRepository songs;

    public PlaylistController(PlaylistRepository playlists, SongRepository songs) {
        this.playlists = playlists;
        this.songs = songs;
    }

    private Playlist find(Long id) {
        return playlists.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Playlist not found"));
    }

    @GetMapping
    public List<Playlist> all() {
        return playlists.findAll();
    }

    @PostMapping
    public Playlist create(@RequestBody PlaylistRequest req) {
        if (req.name() == null || req.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Give the playlist a name");
        }
        Playlist p = new Playlist();
        p.setName(req.name().trim());
        p.setDescription(req.description() == null ? "" : req.description().trim());
        return playlists.save(p);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        playlists.delete(find(id));
    }

    @PostMapping("/{id}/songs/{songId}")
    public Playlist addSong(@PathVariable Long id, @PathVariable Long songId) {
        Playlist p = find(id);
        Song s = songs.findById(songId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Song not found"));
        if (p.getSongs().stream().noneMatch(x -> x.getId().equals(songId))) {
            p.getSongs().add(s);
        }
        return playlists.save(p);
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public Playlist removeSong(@PathVariable Long id, @PathVariable Long songId) {
        Playlist p = find(id);
        p.getSongs().removeIf(x -> x.getId().equals(songId));
        return playlists.save(p);
    }
}
