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

const renderTimeline = (items = []) => {
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

    const media = document.createElement("div");
    media.className = "media-grid";
    (entry.media || []).forEach((item) => media.appendChild(createMediaElement(item)));

    card.appendChild(body);
    card.appendChild(media);
    timelineRoot.appendChild(card);
  });
};

const renderGallery = (items = []) => {
  galleryRoot.innerHTML = "";
  items.forEach((item) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = item.src || "";
    img.alt = safeText(item.alt, "回忆照片");
    figure.appendChild(img);

    if (item.caption) {
      const caption = document.createElement("figcaption");
      caption.textContent = item.caption;
      figure.appendChild(caption);
    }

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
};

const init = async () => {
  setupScrollHint();
  const content = await loadContent();
  applyContent(content);
  revealOnScroll();
};

init();
