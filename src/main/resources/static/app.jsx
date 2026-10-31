const { useState, useEffect, useRef } = React;

const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  prev: "M6 6h2v12H6zm3.5 6 8.5 6V6z",
  shuffle: "M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  repeat: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  heartOut: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
  down: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
  back: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  search: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  home: "M12 3 3 10v11h6v-6h6v6h6V10z",
  library: "M4 4h2v16H4zm5 0h2v16H9zm4.3.5 1.9-.5 4.8 15.5-1.9.5z",
  plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  more: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
};
const Icon = ({ n, size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true"><path d={ICONS[n]} /></svg>
);

const hueOf = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const grad = (s) => { const h = hueOf(s); return `linear-gradient(135deg,hsl(${h} 70% 45%),hsl(${(h + 50) % 360} 75% 30%))`; };
const fmt = (s) => isFinite(s) && s > 0 ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00";

async function request(method, url, body) {
  const res = await fetch("/api" + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "Something went wrong";
    try { const j = await res.json(); msg = j.message || j.error || msg; } catch (e) {}
    throw new Error(msg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
const get = (u) => request("GET", u);

function Cover({ song, size, text, seed }) {
  const style = size ? { width: size, height: size } : {};
  if (song && song.artworkUrl) {
    return <img className="cover" style={style} src={song.artworkUrl} alt="" loading="lazy" />;
  }
  const key = song ? song.id : seed;
  return <div className="cover" style={{ ...style, background: grad(key) }}>{text || (song ? song.title[0] : "")}</div>;
}

function TrackRow({ song, list, index, current, playing, onPlay, onLike, onMenu, onRemove }) {
  const on = current && current.id === song.id;
  return (
    <div className={"track" + (on ? " playing" : "")}>
      <button className="main-btn" onClick={() => onPlay(list, index)} aria-label={"Play " + song.title}>
        <Cover song={song} />
        <span className="meta">
          <b>{song.title}</b>
          <span className="sub">{on && playing ? "Playing · " : ""}{song.artist}{song.language ? " · " + song.language : ""}</span>
        </span>
      </button>
      <button className={"icon-btn" + (song.liked ? " on" : "")} onClick={() => onLike(song)} aria-label={song.liked ? "Unlike" : "Like"}>
        <Icon n={song.liked ? "heart" : "heartOut"} />
      </button>
      <button className="icon-btn" onClick={() => (onRemove ? onRemove(song) : onMenu(song))} aria-label={onRemove ? "Remove from playlist" : "Add to playlist"}>
        <Icon n={onRemove ? "down" : "more"} />
      </button>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function CreatePlaylist({ song, onDone, onClose }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const p = await request("POST", "/playlists", { name, description: desc });
      if (song) await request("POST", `/playlists/${p.id}/songs/${song.id}`);
      onDone(song ? `Added to ${p.name}` : `Created ${p.name}`);
    } catch (e) { onDone(e.message); }
    setBusy(false);
  }
  return (
    <Sheet title="New playlist" onClose={onClose}>
      <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Tamil favourites" autoFocus /></label>
      <label className="field"><span>Description (optional)</span><input value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
      <button className="btn block" onClick={save} disabled={busy}>Create playlist</button>
    </Sheet>
  );
}

function AddToPlaylist({ song, playlists, onAdd, onNew, onClose }) {
  return (
    <Sheet title="Add to playlist" onClose={onClose}>
      <button className="list-btn" onClick={onNew}>
        <div className="cover" style={{ width: 44, height: 44 }}><Icon n="plus" /></div>
        <b>New playlist</b>
      </button>
      {playlists.map((p) => (
        <button key={p.id} className="list-btn" onClick={() => onAdd(p)}>
          <Cover song={p.songs[0]} seed={"pl" + p.id} text={p.name[0]} size={44} />
          <span className="meta"><b>{p.name}</b><span className="sub">{p.songs.length} songs</span></span>
        </button>
      ))}
    </Sheet>
  );
}

function ImportSongs({ languages, defaultLang, defaultTerm, onDone, onClose }) {
  const [term, setTerm] = useState(defaultTerm || "");
  const [lang, setLang] = useState(defaultLang || "Tamil");
  const [busy, setBusy] = useState(false);
  const options = Array.from(new Set(["Tamil", "Hindi", "Telugu", "Malayalam", "Kannada", "English", ...languages]));
  async function go() {
    setBusy(true);
    try {
      const r = await request("POST", "/songs/import", { term, language: lang });
      onDone(r.added ? `Added ${r.added} songs` : "No new songs found for that search");
    } catch (e) { onDone(e.message); }
    setBusy(false);
  }
  return (
    <Sheet title="Find more songs" onClose={onClose}>
      <label className="field"><span>Song, artist or album</span><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Anirudh, Yuvan, Ilaiyaraaja…" autoFocus /></label>
      <label className="field"><span>Language to file them under</span>
        <input list="langs" value={lang} onChange={(e) => setLang(e.target.value)} />
        <datalist id="langs">{options.map((l) => <option key={l} value={l} />)}</datalist>
      </label>
      <button className="btn block" onClick={go} disabled={busy}>{busy ? "Searching…" : "Add songs"}</button>
      <p className="note">Songs from the catalog play as 30-second previews.</p>
    </Sheet>
  );
}

function UploadSong({ defaultLang, onDone, onClose }) {
  const [form, setForm] = useState({ title: "", artist: "", album: "", language: defaultLang || "Tamil" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  async function go() {
    if (!file) return onDone("Choose an audio file first");
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      const res = await fetch("/api/songs/upload", { method: "POST", body: fd });
      if (!res.ok) { let m = "Upload failed"; try { m = (await res.json()).message || m; } catch (e) {} throw new Error(m); }
      onDone("Song uploaded");
    } catch (e) { onDone(e.message); }
    setBusy(false);
  }
  return (
    <Sheet title="Upload your own song" onClose={onClose}>
      <label className="field"><span>Audio file (mp3, m4a, wav…)</span><input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} /></label>
      <label className="field"><span>Title</span><input value={form.title} onChange={set("title")} /></label>
      <label className="field"><span>Artist</span><input value={form.artist} onChange={set("artist")} /></label>
      <label className="field"><span>Album</span><input value={form.album} onChange={set("album")} /></label>
      <label className="field"><span>Language</span><input value={form.language} onChange={set("language")} /></label>
      <button className="btn block" onClick={go} disabled={busy}>{busy ? "Uploading…" : "Upload"}</button>
    </Sheet>
  );
}

function App() {
  const audioRef = useRef(null);
  if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.preload = "metadata"; }
  const audio = audioRef.current;

  const [tab, setTab] = useState("home");
  const [detail, setDetail] = useState(null);
  const [songs, setSongs] = useState([]);
  const [liked, setLiked] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [lang, setLang] = useState("");
  const [q, setQ] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [open, setOpen] = useState(false);
  const song = queue[idx];

  const live = useRef({});
  live.current = { queue, idx, repeat, shuffle };

  const toast = (m) => { setToastMsg(m); clearTimeout(toast.t); toast.t = setTimeout(() => setToastMsg(""), 2200); };
  const refresh = () => setReload((n) => n + 1);

  useEffect(() => {
    const t = setTimeout(() => {
      Promise.all([
        get(`/songs?q=${encodeURIComponent(q)}&language=${encodeURIComponent(lang)}`),
        get("/songs?liked=true"),
        get("/playlists"),
        get("/languages"),
      ]).then(([s, l, p, g]) => { setSongs(s); setLiked(l); setPlaylists(p); setLanguages(g); })
        .catch(() => toast("Can't reach the server"))
        .finally(() => setLoading(false));
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, lang, reload]);

  useEffect(() => {
    const onTime = () => { setProgress(audio.currentTime); };
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => next(true);
    const onErr = () => toast("This song could not be played");
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  useEffect(() => {
    if (!song) return;
    audio.src = song.audioUrl;
    audio.play().catch(() => {});
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title, artist: song.artist, album: song.album || "",
        artwork: song.artworkUrl ? [{ src: song.artworkUrl, sizes: "300x300" }] : [],
      });
      navigator.mediaSession.setActionHandler("play", toggle);
      navigator.mediaSession.setActionHandler("pause", toggle);
      navigator.mediaSession.setActionHandler("nexttrack", () => next(false));
      navigator.mediaSession.setActionHandler("previoustrack", prev);
    }
  }, [song && song.id, idx]);

  function toggle() { if (!audio.src) return; audio.paused ? audio.play().catch(() => {}) : audio.pause(); }
  function next(auto) {
    const { queue, idx, repeat } = live.current;
    if (!queue.length) return;
    if (auto && repeat === 2) { audio.currentTime = 0; audio.play(); return; }
    let i = idx + 1;
    if (i >= queue.length) { if (repeat === 1 || !auto) i = 0; else return; }
    setIdx(i);
  }
  function prev() {
    const { queue, idx } = live.current;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (queue.length) setIdx(idx > 0 ? idx - 1 : queue.length - 1);
  }
  function playList(list, i) {
    if (!list.length) return;
    let l = list, s = i;
    if (live.current.shuffle) {
      l = [list[i], ...list.filter((_, k) => k !== i).sort(() => Math.random() - 0.5)];
      s = 0;
    }
    if (song && l[s].id === song.id) { toggle(); return; }
    setQueue(l); setIdx(s);
  }
  async function like(s) {
    try {
      const u = await request("POST", `/songs/${s.id}/like`);
      setQueue((qu) => qu.map((x) => (x.id === u.id ? u : x)));
      if (u.liked) toast("Added to Liked Songs");
      refresh();
    } catch (e) { toast(e.message); }
  }
  async function addTo(p) {
    try { await request("POST", `/playlists/${p.id}/songs/${modal.song.id}`); toast("Added to " + p.name); refresh(); }
    catch (e) { toast(e.message); }
    setModal(null);
  }
  async function removeFrom(p, s) {
    try { await request("DELETE", `/playlists/${p.id}/songs/${s.id}`); refresh(); } catch (e) { toast(e.message); }
  }
  async function deletePlaylist(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try { await request("DELETE", `/playlists/${p.id}`); setDetail(null); refresh(); toast("Playlist deleted"); }
    catch (e) { toast(e.message); }
  }
  const done = (msg) => { setModal(null); toast(msg); refresh(); };

  const rowProps = { current: song, playing, onPlay: playList, onLike: like, onMenu: (s) => setModal({ type: "add", song: s }) };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  function langChips() {
    return (
      <div className="chips" role="tablist" aria-label="Language">
        {["", ...languages].map((l) => (
          <button key={l || "all"} className={"chip" + (lang === l ? " on" : "")} onClick={() => setLang(l)}>{l || "All"}</button>
        ))}
      </div>
    );
  }
  function songList(list) {
    if (loading) return <p className="empty">Loading songs…</p>;
    if (!list.length) return <p className="empty">No songs found.<br />Use “Find more songs” in Your Library to add some.</p>;
    return list.map((s, i) => <TrackRow key={s.id} song={s} list={list} index={i} {...rowProps} />);
  }

  function homeView() {
    return (
      <>
        <div className="top"><h1>{greeting}</h1></div>
        {langChips()}
        {playlists.length > 0 && (<>
          <h2>Your playlists</h2>
          <div className="row">
            {playlists.map((p) => (
              <button key={p.id} className="tile" onClick={() => setDetail(p.id)}>
                <Cover song={p.songs[0]} seed={"pl" + p.id} text={p.name[0]} />
                <b>{p.name}</b><span className="sub">{p.songs.length} songs</span>
              </button>
            ))}
          </div>
        </>)}
        <h2>{lang ? lang + " songs" : "All songs"}</h2>
        {songList(songs)}
      </>
    );
  }
  function searchView() {
    return (
      <>
        <div className="top"><h1>Search</h1></div>
        <label className="search"><Icon n="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Songs, artists or albums" autoComplete="off" />
        </label>
        {langChips()}
        {songList(songs)}
        {q && <button className="btn ghost block" onClick={() => setModal({ type: "import", term: q })}>Find “{q}” in the catalog</button>}
      </>
    );
  }
  function libraryView() {
    return (
      <>
        <div className="top"><h1>Your Library</h1></div>
        <div className="lib-actions">
          <button className="btn" onClick={() => setModal({ type: "create" })}>New playlist</button>
          <button className="btn ghost" onClick={() => setModal({ type: "import" })}>Find more songs</button>
        </div>
        <div className="lib-actions">
          <button className="btn ghost" onClick={() => setModal({ type: "upload" })}>Upload your own song</button>
        </div>
        <button className="track main-btn" style={{ width: "100%", gap: 12 }} onClick={() => setDetail("liked")}>
          <div className="cover" style={{ width: 56, height: 56, background: "linear-gradient(135deg,#450af5,#c4efd9)" }}><Icon n="heart" /></div>
          <span className="meta"><b>Liked Songs</b><span className="sub">Playlist · {liked.length} songs</span></span>
        </button>
        {playlists.map((p) => (
          <button key={p.id} className="track main-btn" style={{ width: "100%", gap: 12 }} onClick={() => setDetail(p.id)}>
            <Cover song={p.songs[0]} seed={"pl" + p.id} text={p.name[0]} size={56} />
            <span className="meta"><b>{p.name}</b><span className="sub">Playlist · {p.songs.length} songs</span></span>
          </button>
        ))}
      </>
    );
  }
  function detailView() {
    const isLiked = detail === "liked";
    const p = isLiked ? null : playlists.find((x) => x.id === detail);
    if (!isLiked && !p) return <div className="top"><button className="icon-btn" onClick={() => setDetail(null)}><Icon n="back" /></button></div>;
    const name = isLiked ? "Liked Songs" : p.name;
    const list = isLiked ? liked : p.songs;
    const here = playing && song && list.some((s) => s.id === song.id);
    return (
      <>
        <div className="top">
          <button className="icon-btn" onClick={() => setDetail(null)} aria-label="Back"><Icon n="back" /></button>
          {!isLiked && <button className="btn ghost danger" onClick={() => deletePlaylist(p)}>Delete</button>}
        </div>
        <div className="hero">
          {isLiked
            ? <div className="cover" style={{ background: "linear-gradient(135deg,#450af5,#c4efd9)" }}><Icon n="heart" size={64} /></div>
            : <Cover song={list[0]} seed={"pl" + p.id} text={name[0]} />}
          <h1>{name}</h1>
          <p className="sub">{isLiked ? "" : (p.description ? p.description + " · " : "")}{list.length} songs</p>
        </div>
        <div className="actions">
          <button className={"icon-btn" + (shuffle ? " on" : "")} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle"><Icon n="shuffle" /></button>
          <button className="big" onClick={() => (here ? toggle() : playList(list, 0))} aria-label={here ? "Pause" : "Play"}><Icon n={here ? "pause" : "play"} size={30} /></button>
        </div>
        {list.length === 0
          ? <p className="empty">{isLiked ? "Tap the heart on any song to save it here." : "Add songs with the ⋯ button on any song."}</p>
          : list.map((s, i) => <TrackRow key={s.id} song={s} list={list} index={i} {...rowProps} onRemove={isLiked ? null : (x) => removeFrom(p, x)} />)}
      </>
    );
  }

  const pct = duration ? (progress / duration) * 100 : 0;
  const bg = song ? `hsl(${hueOf(song.id)} 55% 32%)` : "#222";
  function miniPlayer() {
    if (!song) return null;
    return (
      <div className="mini" style={{ background: bg }} onClick={() => setOpen(true)} role="button" tabIndex={0} aria-label="Open player"
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}>
        <Cover song={song} size={44} />
        <span className="meta"><b>{song.title}</b><span className="sub" style={{ color: "rgba(255,255,255,.75)" }}>{song.artist}</span></span>
        <button className="icon-btn" style={{ color: song.liked ? "#fff" : "rgba(255,255,255,.75)" }} onClick={(e) => { e.stopPropagation(); like(song); }} aria-label="Like"><Icon n={song.liked ? "heart" : "heartOut"} /></button>
        <button className="icon-btn" style={{ color: "#fff" }} onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? "Pause" : "Play"}><Icon n={playing ? "pause" : "play"} /></button>
        <div className="bar"><i style={{ width: pct + "%" }} /></div>
      </div>
    );
  }
  function fullPlayer() {
    return (
      <section className={"full" + (open && song ? "" : " closed")} style={{ background: `linear-gradient(${bg}, #121212 85%)` }} aria-label="Now playing">
        {song && (<>
          <div className="head">
            <button className="icon-btn" style={{ color: "#fff" }} onClick={() => setOpen(false)} aria-label="Close player"><Icon n="down" /></button>
            <span>{song.language || "Now playing"}</span>
            <span style={{ width: 40 }} />
          </div>
          <div className="art"><Cover song={song} /></div>
          <div className="titles">
            <div><h1>{song.title}</h1><p className="sub" style={{ color: "rgba(255,255,255,.7)" }}>{song.artist}{song.album ? " · " + song.album : ""}</p></div>
            <button className={"icon-btn" + (song.liked ? " on" : "")} style={{ color: song.liked ? "var(--accent)" : "#fff" }} onClick={() => like(song)} aria-label="Like"><Icon n={song.liked ? "heart" : "heartOut"} /></button>
            <button className="icon-btn" style={{ color: "#fff" }} onClick={() => setModal({ type: "add", song })} aria-label="Add to playlist"><Icon n="plus" /></button>
          </div>
          <input type="range" min="0" max="100" step="0.1" value={pct} style={{ "--p": pct + "%" }} aria-label="Seek"
            onChange={(e) => { if (duration) audio.currentTime = (e.target.value / 100) * duration; }} />
          <div className="times"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div>
          <div className="ctrls">
            <button className={shuffle ? "on" : ""} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle"><Icon n="shuffle" size={28} /></button>
            <button onClick={prev} aria-label="Previous"><Icon n="prev" size={28} /></button>
            <button className="play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}><Icon n={playing ? "pause" : "play"} size={30} /></button>
            <button onClick={() => next(false)} aria-label="Next"><Icon n="next" size={28} /></button>
            <button className={repeat ? "on" : ""} onClick={() => setRepeat((repeat + 1) % 3)} aria-label="Repeat" style={{ position: "relative" }}>
              <Icon n="repeat" size={28} />{repeat === 2 && <b style={{ position: "absolute", fontSize: 10, right: 2, top: 2 }}>1</b>}
            </button>
          </div>
          {song.source === "itunes" && <p className="note">30-second preview</p>}
        </>)}
      </section>
    );
  }

  const view = detail ? detailView() : tab === "home" ? homeView() : tab === "search" ? searchView() : libraryView();

  return (
    <div className="app">
      <main>{view}</main>
      {miniPlayer()}
      <nav>
        {[["home", "Home"], ["search", "Search"], ["library", "Your Library"]].map(([k, label]) => (
          <button key={k} className={tab === k && !detail ? "on" : ""} onClick={() => { setTab(k); setDetail(null); }}>
            <Icon n={k} />{label}
          </button>
        ))}
      </nav>
      {fullPlayer()}
      {modal && modal.type === "create" && <CreatePlaylist song={null} onDone={done} onClose={() => setModal(null)} />}
      {modal && modal.type === "newForSong" && <CreatePlaylist song={modal.song} onDone={done} onClose={() => setModal(null)} />}
      {modal && modal.type === "add" && <AddToPlaylist song={modal.song} playlists={playlists} onAdd={addTo} onNew={() => setModal({ type: "newForSong", song: modal.song })} onClose={() => setModal(null)} />}
      {modal && modal.type === "import" && <ImportSongs languages={languages} defaultLang={lang} defaultTerm={modal.term} onDone={done} onClose={() => setModal(null)} />}
      {modal && modal.type === "upload" && <UploadSong defaultLang={lang} onDone={done} onClose={() => setModal(null)} />}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
