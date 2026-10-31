package com.tunely.service;

import com.tunely.model.Playlist;
import com.tunely.model.Song;
import com.tunely.repo.PlaylistRepository;
import com.tunely.repo.SongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final SongRepository songs;
    private final PlaylistRepository playlists;
    private final ItunesImportService importer;

    public DataSeeder(SongRepository songs, PlaylistRepository playlists, ItunesImportService importer) {
        this.songs = songs;
        this.playlists = playlists;
        this.importer = importer;
    }

    @Override
    public void run(String... args) {
        if (songs.count() > 0) return;
        new Thread(this::seed, "seeder").start();
    }

    private void seed() {
        Map<String, String[]> plan = new LinkedHashMap<>();
        plan.put("English", new String[]{"top english pop hits", "ed sheeran"});
        plan.put("Hindi", new String[]{"arijit singh", "bollywood hits"});
        plan.put("Telugu", new String[]{"telugu hits"});
        plan.put("Malayalam", new String[]{"malayalam hits"});
        plan.put("Kannada", new String[]{"kannada hits"});
        plan.put("Tamil", new String[]{"yuvan shankar raja", "ilaiyaraaja", "a r rahman tamil", "anirudh ravichander", "tamil hits"});

        for (var entry : plan.entrySet()) {
            for (String term : entry.getValue()) {
                try {
                    int n = importer.importSongs(term, entry.getKey(), 25);
                    log.info("Imported {} {} songs for '{}'", n, entry.getKey(), term);
                } catch (Exception e) {
                    log.warn("Could not import '{}': {}", term, e.getMessage());
                }
            }
        }

        try {
            List<Song> tamil = songs.search("", "Tamil", false);
            if (!tamil.isEmpty() && playlists.count() == 0) {
                Playlist p = new Playlist();
                p.setName("Tamil Hits");
                p.setDescription("Tamil songs to start with");
                p.setSongs(new ArrayList<>(tamil.subList(0, Math.min(15, tamil.size()))));
                playlists.save(p);
            }
        } catch (Exception e) {
            log.warn("Could not create starter playlist: {}", e.getMessage());
        }
    }
}
