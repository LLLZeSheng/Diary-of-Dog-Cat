const timelineRoot = document.getElementById("timeline-items");
const galleryRoot = document.getElementById("gallery-grid");

const safeText = (value, fallback = "") =>
  value === undefined || value === null || value === "" ? fallback : value;

const createMediaElement = (item) => {
  const figure = document.createElement("figure");
  if (item.type === "video") {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    if (item.poster) video.poster = item.poster;
    if (item.src) video.src = item.src;
    figure.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = safeText(item.alt, "回忆照片");
    if (item.src) img.src = item.src;
    figure.appendChild(img);
  }

  if (item.caption) {
    const caption = document.createElement("figcaption");
    caption.textContent = item.caption;
    figure.appendChild(caption);
  }

  return figure;
};

const formatMediaCount = (media = []) => {
  let images = 0;
  let videos = 0;
  media.forEach((item) => {
    if (item.type === "video") videos += 1;
    else images += 1;
  });
  const parts = [];
  if (images) parts.push(`${images} 张照片`);
  if (videos) parts.push(`${videos} 段视频`);
  return parts.join(" · ");
};

const createAlbumElement = (album = {}) => {
  const section = document.createElement("section");
  section.className = "album";

  const head = document.createElement("div");
  head.className = "album-head";

  const title = document.createElement("h4");
  title.className = "album-title";
  title.textContent = safeText(album.title, "影集");

  head.appendChild(title);

  const metaText = formatMediaCount(album.media || []);
  if (metaText) {
    const meta = document.createElement("span");
    meta.className = "album-meta";
    meta.textContent = metaText;
    head.appendChild(meta);
  }

  section.appendChild(head);

  if (album.description) {
    const desc = document.createElement("p");
    desc.className = "album-desc";
    desc.textContent = album.description;
    section.appendChild(desc);
  }

  const media = document.createElement("div");
  media.className = "media-grid";
  (album.media || []).forEach((item) => media.appendChild(createMediaElement(item)));
  section.appendChild(media);

  return section;
};

const renderTimeline = (items = []) => {
  if (!timelineRoot) return;
  timelineRoot.innerHTML = "";
  items.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "timeline-item reveal";

    const body = document.createElement("div");
    body.className = "timeline-body";

    const header = document.createElement("div");
    header.className = "timeline-header";

    const year = document.createElement("div");
    year.className = "timeline-year";
    year.textContent = safeText(entry.year, "我们的故事");

    header.appendChild(year);

    if (entry.date) {
      const date = document.createElement("div");
      date.className = "timeline-date";
      date.textContent = entry.date;
      header.appendChild(date);
    }

    const title = document.createElement("h3");
    title.className = "timeline-title";
    title.textContent = safeText(entry.title, "一段温柔的回忆");

    const text = document.createElement("p");
    text.className = "timeline-text";
    text.textContent = safeText(entry.text, "在这里写下你们的故事。");

    body.appendChild(header);
    body.appendChild(title);
    body.appendChild(text);

    const albumList = document.createElement("div");
    albumList.className = "album-list";

    const albums = Array.isArray(entry.albums) ? entry.albums : [];
    if (albums.length) {
      albums.forEach((album) => albumList.appendChild(createAlbumElement(album)));
    } else if (entry.media && entry.media.length) {
      albumList.appendChild(
        createAlbumElement({
          title: entry.title || "影集",
          media: entry.media,
        })
      );
    }

    card.appendChild(body);
    card.appendChild(albumList);
    timelineRoot.appendChild(card);
  });
};

const renderGallery = (items = []) => {
  if (!galleryRoot) return;
  galleryRoot.innerHTML = "";
  items.forEach((item) => {
    const figure = createMediaElement(item);
    galleryRoot.appendChild(figure);
  });
};

const applyText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el && value) el.textContent = value;
};

const applyParagraphs = (selector, paragraphs) => {
  const el = document.querySelector(selector);
  if (!el || !Array.isArray(paragraphs)) return;
  el.innerHTML = "";
  paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    el.appendChild(p);
  });
};

const setupBgm = (bgm) => {
  const wrapper = document.querySelector("[data-bgm]");
  const audio = document.getElementById("bgm-audio");
  if (!wrapper || !audio || !bgm || !bgm.src) {
    if (wrapper) wrapper.style.display = "none";
    return;
  }

  audio.src = bgm.src;
  audio.preload = "metadata";
  audio.loop = bgm.loop !== false;

  if (typeof bgm.volume === "number") {
    audio.volume = Math.min(1, Math.max(0, bgm.volume));
  }

  const titleEl = wrapper.querySelector("[data-bgm-title]");
  const hintEl = wrapper.querySelector("[data-bgm-hint]");
  const toggle = wrapper.querySelector("[data-bgm-toggle]");

  if (titleEl && bgm.title) titleEl.textContent = bgm.title;
  if (hintEl && bgm.hint) hintEl.textContent = bgm.hint;

  const setState = (playing) => {
    wrapper.classList.toggle("is-playing", playing);
    if (toggle) {
      toggle.textContent = playing ? "暂停音乐" : "播放音乐";
      toggle.setAttribute("aria-pressed", String(playing));
    }
  };

  const tryPlay = () =>
    audio.play().then(
      () => setState(true),
      () => setState(false)
    );

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (audio.paused) {
        tryPlay();
      } else {
        audio.pause();
        setState(false);
      }
    });
  }

  audio.addEventListener("play", () => setState(true));
  audio.addEventListener("pause", () => setState(false));

  setState(!audio.paused && !audio.ended);

  if (bgm.autoplay) {
    tryPlay();
    const attempt = () => tryPlay();
    document.addEventListener("click", attempt, { once: true });
    document.addEventListener("touchstart", attempt, { once: true });
  }
};

const revealOnScroll = () => {
  const reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => observer.observe(el));
};

const setupScrollHint = () => {
  const btn = document.querySelector("[data-scroll-hint]");
  const target = document.getElementById("letter");
  if (!btn || !target) return;
  btn.addEventListener("click", () => {
    target.scrollIntoView({ behavior: "smooth" });
  });
};

const loadContent = async () => {
  try {
    const res = await fetch("assets/content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load content");
    return await res.json();
  } catch (error) {
    console.warn("内容加载失败，使用默认占位内容。", error);
    return null;
  }
};

const applyContent = (content) => {
  if (!content) return;

  document.title = safeText(content.site?.title, document.title);
  applyText("[data-hero-kicker]", content.hero?.kicker);
  applyText("[data-hero-title]", content.hero?.headline);
  applyText("[data-hero-sub]", content.hero?.subheadline);
  applyText("[data-hero-date]", content.site?.date);
  applyText("[data-hero-sign]", content.site?.signature);
  applyText("[data-scroll-hint]", content.hero?.scrollHint);

  applyText("[data-letter-title]", content.letter?.title);
  applyParagraphs("[data-letter-body]", content.letter?.paragraphs);

  applyText("[data-timeline-title]", content.timeline?.title);
  renderTimeline(content.timeline?.items || []);

  applyText("[data-gallery-title]", content.gallery?.title);
  renderGallery(content.gallery?.items || []);

  applyText("[data-final-title]", content.final?.title);
  applyParagraphs("[data-final-body]", content.final?.paragraphs);
  applyText("[data-final-sign]", content.final?.signature);

  applyText("[data-footer-copy]", content.site?.footer);

  setupBgm(content.bgm);
};

const init = async () => {
  setupScrollHint();
  const content = await loadContent();
  applyContent(content);
  revealOnScroll();
};

init();
