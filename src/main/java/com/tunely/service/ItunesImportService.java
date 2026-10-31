package com.tunely.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tunely.model.Song;
import com.tunely.repo.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Service
public class ItunesImportService {

    private final SongRepository songs;
    private final ObjectMapper mapper = new ObjectMapper();
    private final RestClient http = RestClient.create();

    public ItunesImportService(SongRepository songs) {
        this.songs = songs;
    }

    public int importSongs(String term, String language, int limit) throws Exception {
        URI uri = UriComponentsBuilder.fromUriString("https://itunes.apple.com/search")
                .queryParam("term", term)
                .queryParam("media", "music")
                .queryParam("entity", "song")
                .queryParam("country", "IN")
                .queryParam("limit", limit)
                .build().encode().toUri();

        String body = http.get().uri(uri).retrieve().body(String.class);
        if (body == null) return 0;

        int added = 0;
        for (JsonNode r : mapper.readTree(body).path("results")) {
            String preview = r.path("previewUrl").asText("");
            String trackId = r.path("trackId").asText("");
            if (preview.isEmpty() || trackId.isEmpty()) continue;
            String externalId = "itunes:" + trackId;
            if (songs.existsByExternalId(externalId)) continue;

            Song s = new Song();
            s.setTitle(r.path("trackName").asText("Untitled"));
            s.setArtist(r.path("artistName").asText(""));
            s.setAlbum(r.path("collectionName").asText(""));
            s.setGenre(r.path("primaryGenreName").asText(""));
            s.setLanguage(language);
            s.setAudioUrl(preview);
            s.setArtworkUrl(r.path("artworkUrl100").asText("").replace("100x100", "300x300"));
            s.setDurationMs(r.path("trackTimeMillis").asLong(0));
            s.setSource("itunes");
            s.setExternalId(externalId);
            songs.save(s);
            added++;
        }
        return added;
    }
}
