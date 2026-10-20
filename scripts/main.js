const API_BASE_URL = window.PORTFOLIO_API_URL ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:5106"
    : "");
const useApi = Boolean(window.PORTFOLIO_API_URL) ||
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const fallbackProjects = [
  {
    title: "Persoonlijk portfolio",
    category: "Web",
    description:
      "Een toegankelijke, responsive website waarmee ik mijn kennis over HTML, CSS en JavaScript toepas en verbeter.",
    date: "2026-01-01T00:00:00Z",
    gitHubUrl: null,
  },
  {
    title: "A Knight's Journey",
    category: "Game development",
    description:
      "Een hobbyproject in Godot waarin ik een 2D metroidvania meets platformer game ontwerp en ontwikkel.",
    date: "2025-01-01T00:00:00Z",
    gitHubUrl: null,
  },
  {
    title: "Hotel Simulator",
    category: "Software",
    description:
      "Een Java-simulatie waarin gasten kunnen inchecken, uitchecken en kamers kunnen reserveren.",
    date: "2026-01-01T00:00:00Z",
    gitHubUrl: "https://github.com/Mausin123457/Hotel-Simulator",
  },
];
const fallbackBlogPosts = [
  {
    title: "Waarom semantische HTML belangrijk is",
    content:
      "Toen ik begon met HTML dacht ik vooral aan de visuele kant van een website. Inmiddels begrijp ik dat HTML ook betekenis geeft aan de inhoud. Een kop hoort bijvoorbeeld in een h1- of h2-element en navigatie hoort in een nav-element.\n\nSemantische HTML helpt bezoekers die met een schermlezer navigeren, maar maakt een pagina ook overzichtelijker voor ontwikkelaars. De structuur van de code vertelt meteen welke onderdelen belangrijk zijn.\n\nDaarom gebruik ik op deze portfoliosecties onder andere main, section, article, header en footer. CSS bepaalt de vormgeving, terwijl HTML de betekenis en volgorde van de informatie bewaakt.",
    publicationDate: "2026-09-03T00:00:00Z",
  },
  {
    title: "Mijn eerste stappen met versiebeheer",
    content:
      "Met Git kan ik mijn wijzigingen in mijn projecten bijhouden. Een commit is daarbij een logisch moment waarop ik een werkende wijziging vastleg met een korte beschrijving.\n\nIn het begin maakte ik commits te groot en was het lastig om later terug te vinden wat er veranderd was. Door kleinere commits te maken, blijft de geschiedenis begrijpelijk en kan ik eenvoudiger een fout onderzoeken.\n\nBranches geven mij ruimte om iets nieuws te proberen zonder de stabiele versie direct te veranderen. Dat maakt versiebeheer niet alleen handig voor samenwerken, maar ook voor mijn eigen leerproces.",
    publicationDate: "2026-09-22T00:00:00Z",
  },
];
let projects = [];
let blogPosts = [];

const apiRequest = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json();
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" })
    .format(new Date(value));

const loadPortfolioData = async () => {
  if (!useApi) {
    projects = fallbackProjects;
    blogPosts = fallbackBlogPosts;
    return;
  }

  [projects, blogPosts] = await Promise.all([
    apiRequest("/api/projects"),
    apiRequest("/api/blogposts"),
  ]);
};

const createElement = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const renderProjects = () => {
  const list = document.querySelector("#project-list");
  if (!list) return;

  const search = document
    .querySelector("#project-search")
    .value.trim()
    .toLowerCase();
  const category = document.querySelector("#project-category").value;
  const sort = document.querySelector("#project-sort").value;
  const visibleProjects = projects
    .filter((project) => category === "all" || project.category === category)
    .filter((project) =>
      `${project.title} ${project.category} ${project.description}`
        .toLowerCase()
        .includes(search),
    )
    .sort((first, second) =>
      sort === "name"
        ? first.title.localeCompare(second.title)
        : new Date(second.date) - new Date(first.date),
    );

  list.replaceChildren(
    ...visibleProjects.map((project) => {
      const card = createElement("article", null, "project-card");
      card.append(
        createElement("p", project.category, "card-label"),
        createElement("h3", project.title),
        createElement("p", project.description),
      );
      card.append(createElement("p", formatDate(project.date), "muted"));
      if (project.gitHubUrl) {
        const link = createElement("a", "Bekijk op GitHub ↗", "text-link");
        link.href = project.gitHubUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        card.append(link);
      }
      return card;
    }),
  );

  document.querySelector("#project-status").textContent =
    `${visibleProjects.length} van ${projects.length} projecten zichtbaar.`;
};

const setupProjects = () => {
  const categorySelect = document.querySelector("#project-category");
  if (!categorySelect) return;
  [...new Set(projects.map((project) => project.category))].forEach(
    (category) => {
      const option = createElement("option", category);
      option.value = category;
      categorySelect.append(option);
    },
  );
  document
    .querySelector("#project-search")
    .addEventListener("input", renderProjects);
  categorySelect.addEventListener("change", renderProjects);
  document
    .querySelector("#project-sort")
    .addEventListener("change", renderProjects);
  renderProjects();
};

const renderBlogs = () => {
  const list = document.querySelector("#blog-list");
  if (!list) return;
  list.replaceChildren(
    ...blogPosts.map((post) => {
      const article = createElement("article", null, "article-preview");
      const details = createElement("details");
      const summary = createElement("summary");
      const content = createElement("div");
      const title = createElement("span", post.title, "article-title");
      title.setAttribute("role", "heading");
      title.setAttribute("aria-level", "3");
      summary.append(
        createElement("span", formatDate(post.publicationDate), "card-label"),
        title,
      );
      post.content.split(/\r?\n\r?\n/).forEach((paragraph) =>
        content.append(createElement("p", paragraph)),
      );
      details.append(summary, content);
      article.append(details);
      return article;
    }),
  );
};

const validateField = (field, message) => {
  const error = document.querySelector(`#${field.id}-error`);
  const isValid =
    field.value.trim() && (field.type !== "email" || field.validity.valid);
  field.classList.toggle("has-error", !isValid);
  field.setAttribute("aria-invalid", String(!isValid));
  error.textContent = isValid ? "" : message;
  return isValid;
};

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds)) return "Onbekende duur";
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
};

const renderSong = (song, result) => {
  const card = createElement("article", null, "music-result");
  const singers =
    song.singers ||
    song.primary_artists ||
    (song.artistMap && Object.keys(song.artistMap).join(", ")) ||
    "Onbekend";
  const image = document.createElement("img");
  image.src = song.image;
  image.alt = `Albumcover van ${song.album || "onbekend album"}`;
  const details = createElement("div");
  details.append(
    createElement("h3", song.song || song.title || "Onbekende titel"),
    createElement("p", `Zanger: ${singers}`),
    createElement("p", `Album: ${song.album || "Onbekend"}`),
    createElement("p", `Duur: ${formatDuration(song.duration)}`),
  );
  const lyrics = createElement("details", null, "lyrics");
  lyrics.append(createElement("summary", "Lyrics bekijken"));
  lyrics.append(
    createElement(
      "p",
      song.lyrics ||
        song.lyrics_snippet ||
        "Voor dit nummer zijn geen lyrics beschikbaar.",
    ),
  );
  if (song.perma_url) {
    try {
      const url = new URL(song.perma_url, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:") {
        const link = createElement("a", "Bekijk op JioSaavn ↗", "text-link");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        lyrics.append(link);
      }
    } catch {
      // Ignore malformed URLs from the API.
    }
  }
  details.append(lyrics);
  card.append(image, details);
  result.replaceChildren(card);
};

let musicRequestId = 0;
let musicRequestController;

const searchMusic = async (query) => {
  const status = document.querySelector("#music-status");
  const result = document.querySelector("#music-result");
  if (!status || !result) return;
  const requestId = ++musicRequestId;
  musicRequestController?.abort();
  musicRequestController = new AbortController();
  const { signal } = musicRequestController;
  status.textContent = "Muziek wordt geladen...";
  result.replaceChildren();
  try {
    const endpoint = `https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(query)}&lyrics=true`;
    const response = await fetch(endpoint, { signal });
    if (!response.ok) throw new Error("API response was not successful");
    const songs = await response.json();
    if (requestId !== musicRequestId) return;
    const song = songs[0];
    if (!song) throw new Error("No song found");
    renderSong(song, result);
    status.textContent = `${songs.length} resultaat/resultaten gevonden.`;
  } catch (error) {
    if (requestId !== musicRequestId || error.name === "AbortError") return;
    status.textContent =
      "De muziekgegevens konden niet worden geladen. Controleer je zoekterm en probeer het opnieuw.";
  }
};

const setupMusic = () => {
  const form = document.querySelector("#music-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = form.elements["music-search"].value.trim();
    if (query) searchMusic(query);
  });
  searchMusic(form.elements["music-search"].value);
};

const setupFooterContact = () => {
  const form = document.querySelector("#footer-contact-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.elements.name;
    const email = form.elements.email;
    const message = form.elements.message;
    const feedback = document.querySelector("#footer-form-feedback");
    const validateFooterField = (field, messageText) => {
      const error = document.querySelector(`#${field.id}-error`);
      const valid =
        field.type === "email"
          ? field.validity.valid && field.value.trim().length > 0
          : field.value.trim().length > 0;
      field.classList.toggle("has-error", !valid);
      field.setAttribute("aria-invalid", String(!valid));
      error.textContent = valid ? "" : messageText;
      return valid;
    };
    const nameValid = validateFooterField(name, "Vul je naam in.");
    const emailValid = validateFooterField(
      email,
      "Vul een geldig e-mailadres in.",
    );
    const messageValid =
      validateFooterField(message, "Schrijf minimaal 10 tekens.") &&
      message.value.trim().length >= 10;
    if (!messageValid && message.value.trim().length > 0) {
      message.classList.add("has-error");
      message.setAttribute("aria-invalid", "true");
      document.querySelector("#footer-message-error").textContent =
        "Je bericht moet minimaal 10 tekens bevatten.";
    }
    if (!nameValid || !emailValid || !messageValid) {
      feedback.textContent = "Controleer de gemarkeerde velden.";
      return;
    }
    feedback.textContent =
      "Bedankt, je bericht staat klaar om opgevolgd te worden.";
    form.reset();
  });
};

const initializePortfolio = async () => {
  try {
    await loadPortfolioData();
    setupProjects();
    renderBlogs();
  } catch (error) {
    const projectStatus = document.querySelector("#project-status");
    const blogList = document.querySelector("#blog-list");
    if (projectStatus) {
      projectStatus.textContent =
        "Projecten konden niet worden geladen. Probeer het later opnieuw.";
    }
    if (blogList) {
      blogList.replaceChildren(
        createElement(
          "p",
          "Blogartikelen konden niet worden geladen. Probeer het later opnieuw.",
          "muted",
        ),
      );
    }
    console.error("Portfolio API unavailable", error);
  }
};

initializePortfolio();
setupMusic();
setupFooterContact();
