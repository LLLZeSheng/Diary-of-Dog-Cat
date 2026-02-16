const timelineRoot = document.getElementById("timeline-items");
const galleryRoot = document.getElementById("gallery-grid");
const galleryNotePanel = document.querySelector("[data-gallery-note-panel]");
const galleryNoteBody = document.querySelector("[data-gallery-note-body]");
const yearReviewRoot = document.querySelector("[data-year-review-body]");
const outlookRoot = document.querySelector("[data-outlook-body]");
const oldMemoriesLink = document.querySelector("[data-old-memories-link]");

const YEAR_REVIEW_DEFAULT_FILES = [
  "assets/小咪&小狗的年终总结.md",
  "assets/小咪&小狗的年终总结.md.txt",
  "assets/小咪&小狗的年终总结.txt",
];

const OUTLOOK_DEFAULT_FILES = [
  "assets/小咪&小狗的信念展望.md",
  "assets/小咪&小狗的新年展望.md",
  "assets/小咪&小狗的新年展望.md.txt",
  "assets/小咪&小狗的新年展望.txt",
];

const DEFAULT_OLD_MEMORIES_VIDEO =
  "assets/小咪小狗的往年精彩/97138a2be9dca643665331b5067f1d90.mp4";

const safeText = (value, fallback = "") =>
  value === undefined || value === null || value === "" ? fallback : value;

const deepClone = (value) => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

const encodePath = (path = "") =>
  String(path)
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const looksLikeHtmlDocument = (text = "") =>
  /<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(text);

const formatInlineMarkdown = (text = "") => {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
};

const isTableDivider = (cells = []) =>
  cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));

const parseTableRow = (row) =>
  row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const markdownToHtml = (markdown) => {
  const source = safeText(markdown).replace(/\r\n?/g, "\n").trim();
  if (!source) return "";

  const lines = source.split("\n");
  const htmlParts = [];

  let paragraph = [];
  let listType = null;
  let listItems = [];
  let tableRows = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const html = paragraph.map((line) => formatInlineMarkdown(line)).join("<br>");
    htmlParts.push(`<p>${html}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) return;
    const items = listItems
      .map((item) => `<li>${formatInlineMarkdown(item)}</li>`)
      .join("");
    htmlParts.push(`<${listType}>${items}</${listType}>`);
    listType = null;
    listItems = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.map(parseTableRow).filter((row) => row.length);
    const cleanedRows = rows.filter((row) => !isTableDivider(row));
    if (!cleanedRows.length) {
      tableRows = [];
      return;
    }

    const header = cleanedRows[0];
    const body = cleanedRows.slice(1);

    const thead = `<thead><tr>${header
      .map((cell) => `<th>${formatInlineMarkdown(cell)}</th>`)
      .join("")}</tr></thead>`;

    const tbody = body.length
      ? `<tbody>${body
          .map(
            (row) =>
              `<tr>${row
                .map((cell) => `<td>${formatInlineMarkdown(cell)}</td>`)
                .join("")}</tr>`
          )
          .join("")}</tbody>`
      : "";

    htmlParts.push(`<div class="story-table-wrap"><table>${thead}${tbody}</table></div>`);
    tableRows = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    if (/^\|.*\|$/.test(trimmed)) {
      flushParagraph();
      flushList();
      tableRows.push(trimmed);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushTable();
      const level = Math.min(6, headingMatch[1].length);
      const text = formatInlineMarkdown(headingMatch[2]);
      htmlParts.push(`<h${level}>${text}</h${level}>`);
      return;
    }

    const blockquoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      flushTable();
      htmlParts.push(`<blockquote>${formatInlineMarkdown(blockquoteMatch[1])}</blockquote>`);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushTable();
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(orderedMatch[1]);
      return;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushTable();
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(unorderedMatch[1]);
      return;
    }

    flushList();
    flushTable();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  flushTable();

  return htmlParts.join("\n");
};

const createMediaElement = (item) => {
  const figure = document.createElement("figure");
  if (item.type === "video") {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    if (item.poster) video.poster = encodePath(item.poster);
    if (item.src) video.src = encodePath(item.src);
    figure.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = safeText(item.alt, "回忆照片");
    if (item.src) img.src = encodePath(item.src);
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

  const content = document.createElement("div");
  content.className = "album-content";

  if (album.message) {
    const message = document.createElement("aside");
    message.className = "album-message story-rich";
    message.innerHTML = markdownToHtml(album.message);
    content.appendChild(message);
  }

  const media = document.createElement("div");
  media.className = "media-grid";
  (album.media || []).forEach((item) => media.appendChild(createMediaElement(item)));
  content.appendChild(media);

  section.appendChild(content);
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

const fetchTextFromCandidates = async (paths = []) => {
  for (const path of paths) {
    if (!path) continue;
    try {
      const response = await fetch(encodePath(path), { cache: "no-store" });
      if (!response.ok) continue;
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      const text = (await response.text()).trim();
      if (contentType.includes("text/html") && looksLikeHtmlDocument(text)) continue;
      if (looksLikeHtmlDocument(text)) continue;
      if (text) return text;
    } catch {
      // Ignore missing candidate and continue.
    }
  }
  return "";
};

const getAlbumDir = (album = {}) => {
  const firstMedia = (album.media || []).find((item) => item && item.src);
  if (!firstMedia || !firstMedia.src) return "";
  const src = String(firstMedia.src).replace(/\\/g, "/");
  const lastSlash = src.lastIndexOf("/");
  if (lastSlash <= 0) return "";
  return src.slice(0, lastSlash);
};

const albumMessageCandidates = (album) => {
  const dir = getAlbumDir(album);
  if (!dir) return [];
  return [`${dir}/寄语.md`, `${dir}/寄语.md.txt`, `${dir}/寄语.txt`];
};

const galleryMessageCandidates = (items = []) => {
  const firstMedia = (items || []).find((item) => item && item.src);
  if (!firstMedia || !firstMedia.src) return [];
  const src = String(firstMedia.src).replace(/\\/g, "/");
  const lastSlash = src.lastIndexOf("/");
  if (lastSlash <= 0) return [];
  const dir = src.slice(0, lastSlash);
  return [`${dir}/寄语.md`, `${dir}/寄语.md.txt`, `${dir}/寄语.txt`];
};

const enrichTimelineWithMessages = async (items = []) => {
  const cloned = deepClone(items || []);
  const jobs = [];

  cloned.forEach((entry) => {
    (entry.albums || []).forEach((album) => {
      jobs.push(
        (async () => {
          const message = await fetchTextFromCandidates(albumMessageCandidates(album));
          if (message) album.message = message;
        })()
      );
    });
  });

  await Promise.all(jobs);
  return cloned;
};

const renderStoryText = (target, text, fallback) => {
  if (!target) return;
  const html = markdownToHtml(text);
  target.innerHTML = html || `<p>${escapeHtml(fallback)}</p>`;
};

const renderExtraStories = async (content = {}) => {
  const extras = content.extras || {};

  const yearReviewFiles = [
    ...(Array.isArray(extras.yearReviewFiles) ? extras.yearReviewFiles : []),
    ...YEAR_REVIEW_DEFAULT_FILES,
  ];
  const yearReviewText = await fetchTextFromCandidates(yearReviewFiles);
  renderStoryText(yearReviewRoot, yearReviewText, "今年的年终总结正在准备中。");

  const outlookFiles = [
    ...(Array.isArray(extras.outlookFiles) ? extras.outlookFiles : []),
    ...OUTLOOK_DEFAULT_FILES,
  ];
  const outlookText = await fetchTextFromCandidates(outlookFiles);
  renderStoryText(outlookRoot, outlookText, "新年展望正在准备中。");

  if (oldMemoriesLink) {
    const oldMemoriesVideo = safeText(extras.oldMemoriesVideo, DEFAULT_OLD_MEMORIES_VIDEO);
    oldMemoriesLink.href = encodePath(oldMemoriesVideo);
  }
};

const setupBgm = (bgm) => {
  const wrapper = document.querySelector("[data-bgm]");
  const audio = document.getElementById("bgm-audio");
  if (!wrapper || !audio || !bgm || !bgm.src) {
    if (wrapper) wrapper.style.display = "none";
    return;
  }

  audio.src = encodePath(bgm.src);
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
  const target = document.getElementById("year-review") || document.getElementById("letter");
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

const applyContent = async (content) => {
  if (!content) return;
  const site = content.site || {};
  const hero = content.hero || {};
  const letter = content.letter || {};
  const timeline = content.timeline || {};
  const gallery = content.gallery || {};
  const final = content.final || {};

  document.title = safeText(site.title, document.title);
  applyText("[data-hero-kicker]", hero.kicker);
  applyText("[data-hero-title]", hero.headline);
  applyText("[data-hero-sub]", hero.subheadline);
  applyText("[data-hero-date]", site.date);
  applyText("[data-hero-sign]", site.signature);
  applyText("[data-scroll-hint]", hero.scrollHint);

  applyText("[data-letter-title]", letter.title);
  applyParagraphs("[data-letter-body]", letter.paragraphs);

  applyText("[data-timeline-title]", timeline.title);
  const timelineItems = await enrichTimelineWithMessages(timeline.items || []);
  renderTimeline(timelineItems);

  applyText("[data-gallery-title]", gallery.title);
  const galleryItems = gallery.items || [];
  renderGallery(galleryItems);
  const galleryMessage = await fetchTextFromCandidates(galleryMessageCandidates(galleryItems));
  if (galleryMessage) {
    renderStoryText(galleryNoteBody, galleryMessage, "");
    if (galleryNotePanel) galleryNotePanel.hidden = false;
  } else if (galleryNotePanel) {
    galleryNotePanel.hidden = true;
  }

  applyText("[data-final-title]", final.title);
  applyParagraphs("[data-final-body]", final.paragraphs);
  applyText("[data-final-sign]", final.signature);

  applyText("[data-footer-copy]", site.footer);
  await renderExtraStories(content);

  setupBgm(content.bgm);
};

const init = async () => {
  setupScrollHint();
  const content = await loadContent();
  await applyContent(content);
  revealOnScroll();
};

init();
