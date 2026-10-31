package com.tunely.web;

import com.tunely.model.Song;
import com.tunely.repo.SongRepository;
import com.tunely.service.ItunesImportService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SongController {

    public record ImportRequest(String term, String language) {}

    private final SongRepository songs;
    private final ItunesImportService importer;
    private final Path uploadDir;

    public SongController(SongRepository songs, ItunesImportService importer,
                          @Value("${tunely.upload-dir}") String uploadDir) {
        this.songs = songs;
        this.importer = importer;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    static String cleanLanguage(String s) {
        if (s == null || s.isBlank()) return "";
        String t = s.trim();
        return t.substring(0, 1).toUpperCase() + t.substring(1).toLowerCase();
    }

    @GetMapping("/songs")
    public List<Song> list(@RequestParam(defaultValue = "") String q,
                           @RequestParam(defaultValue = "") String language,
                           @RequestParam(defaultValue = "false") boolean liked) {
        return songs.search(q.trim(), cleanLanguage(language), liked);
    }

    @GetMapping("/languages")
    public List<String> languages() {
        return songs.languages();
    }

    @PostMapping("/songs/{id}/like")
    public Song like(@PathVariable Long id) {
        Song s = songs.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        s.setLiked(!s.isLiked());
        return songs.save(s);
    }

    @PostMapping("/songs/import")
    public Map<String, Object> importSongs(@RequestBody ImportRequest req) {
        if (req.term() == null || req.term().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a song, artist or album to search for");
        }
        String lang = cleanLanguage(req.language());
        if (lang.isEmpty()) lang = "Other";
        try {
            int added = importer.importSongs(req.term().trim(), lang, 40);
            return Map.of("added", added);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the music catalog. Try again.");
        }
    }

    @PostMapping(value = "/songs/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Song upload(@RequestParam("file") MultipartFile file,
                       @RequestParam(defaultValue = "") String title,
                       @RequestParam(defaultValue = "") String artist,
                       @RequestParam(defaultValue = "") String album,
                       @RequestParam(defaultValue = "") String language) throws IOException {
        if (file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an audio file");
        String original = file.getOriginalFilename() == null ? "song.mp3" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')).toLowerCase() : ".mp3";
        if (!List.of(".mp3", ".m4a", ".aac", ".wav", ".ogg", ".flac").contains(ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an mp3, m4a, aac, wav, ogg or flac file");
        }
        Files.createDirectories(uploadDir);
        String stored = UUID.randomUUID() + ext;
        file.transferTo(uploadDir.resolve(stored));

        Song s = new Song();
        s.setTitle(title.isBlank() ? original.replaceFirst("\\.[^.]+$", "") : title.trim());
        s.setArtist(artist.isBlank() ? "Unknown artist" : artist.trim());
        s.setAlbum(album.trim());
        String lang = cleanLanguage(language);
        s.setLanguage(lang.isEmpty() ? "Other" : lang);
        s.setAudioUrl("/api/files/" + stored);
        s.setSource("upload");
        return songs.save(s);
    }
}
