const projects = [
  {
    name: "Persoonlijk portfolio",
    category: "Web",
    technology: "HTML & CSS",
    description:
      "Een toegankelijke, responsive website waarmee ik mijn kennis over HTML, CSS en JavaScript toepas en verbeter.",
    year: 2026,
  },
  {
    name: "A Knight's Journey",
    category: "Game development",
    technology: "C# & design",
    description:
      "Een hobbyproject in Godot waarin ik een 2D metroidvania meets platformer game ontwerp en ontwikkel.",
    year: 2025,
  },
  {
    name: "Hotel Simulator",
    category: "Software",
    technology: "Java & back-end",
    description:
      "Een Java-simulatie waarin gasten kunnen inchecken, uitchecken en kamers kunnen reserveren.",
    year: 2026,
    link: "./hotel_simulator.html",
  },
];

const blogPosts = [
  {
    date: "03 september 2026",
    category: "HTML",
    title: "Waarom semantische HTML belangrijk is",
    description:
      "Een eerste kennismaking met betekenisvolle elementen, structuur en toegankelijkheid.",
    paragraphs: [
      "Toen ik begon met HTML dacht ik vooral aan de visuele kant van een website. Inmiddels begrijp ik dat HTML ook betekenis geeft aan de inhoud. Een kop hoort bijvoorbeeld in een h1- of h2-element en navigatie hoort in een nav-element.",
      "Semantische HTML helpt bezoekers die met een schermlezer navigeren, maar maakt een pagina ook overzichtelijker voor ontwikkelaars. De structuur van de code vertelt meteen welke onderdelen belangrijk zijn.",
      "Daarom gebruik ik op deze portfoliosecties onder andere main, section, article, header en footer. CSS bepaalt de vormgeving, terwijl HTML de betekenis en volgorde van de informatie bewaakt.",
    ],
  },
  {
    date: "22-9-2026",
    category: "Git",
    title: "Mijn eerste stappen met versiebeheer",
    description:
      "Wat commits, branches en een duidelijke geschiedenis mij leren over samenwerken.",
    paragraphs: [
      "Met Git kan ik wijzigingen in mijn projecten bijhouden. Een commit is daarbij een logisch moment waarop ik een werkende wijziging vastleg met een korte beschrijving.",
      "In het begin maakte ik commits te groot en was het lastig om later terug te vinden wat er veranderd was. Door kleinere commits te maken, blijft de geschiedenis begrijpelijk en kan ik eenvoudiger een fout onderzoeken.",
      "Branches geven mij ruimte om iets nieuws te proberen zonder de stabiele versie direct te veranderen. Dat maakt versiebeheer niet alleen handig voor samenwerken, maar ook voor mijn eigen leerproces.",
    ],
  },
];

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
      `${project.name} ${project.technology}`.toLowerCase().includes(search),
    )
    .sort((first, second) =>
      sort === "name"
        ? first.name.localeCompare(second.name)
        : second.year - first.year,
    );

  list.replaceChildren(
    ...visibleProjects.map((project) => {
      const card = createElement("article", null, "project-card");
      card.append(
        createElement("p", project.technology, "card-label"),
        createElement("h3", project.name),
        createElement("p", project.description),
      );
      if (project.link) {
        const link = createElement("a", "Lees meer →", "text-link");
        link.href = project.link;
        card.append(link);
      } else {
        card.append(createElement("span", "Binnenkort meer", "muted"));
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
      const content = createElement("div");
      content.append(
        createElement("p", `${post.date} · ${post.category}`, "card-label"),
        createElement("h3", post.title),
        createElement("p", post.description),
      );
      post.paragraphs.forEach((paragraph) =>
        content.append(createElement("p", paragraph)),
      );
      article.append(content);
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

const setupContactForm = () => {
  const form = document.querySelector("#contact-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const messageIsValid = validateField(
      form.elements.message,
      "Schrijf een bericht van minimaal één zin.",
    );
    if (messageIsValid && form.elements.message.value.trim().length < 10) {
      const messageError = document.querySelector("#message-error");
      messageError.textContent = "Je bericht moet minimaal 10 tekens bevatten.";
      form.elements.message.classList.add("has-error");
      form.elements.message.setAttribute("aria-invalid", "true");
    }
    const valid =
      [
        validateField(form.elements.name, "Vul je naam in."),
        validateField(form.elements.email, "Vul een geldig e-mailadres in."),
        messageIsValid && form.elements.message.value.trim().length >= 10,
      ].every(Boolean) && form.elements.message.value.trim().length >= 10;
    const feedback = document.querySelector("#form-feedback");
    if (!valid) {
      feedback.textContent = "Controleer de gemarkeerde velden.";
      return;
    }
    feedback.textContent =
      "Bedankt voor je bericht. Ik neem zo snel mogelijk contact op.";
    form.reset();
    form
      .querySelectorAll("[aria-invalid]")
      .forEach((field) => field.setAttribute("aria-invalid", "false"));
  });
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
    const link = createElement("a", "Bekijk op JioSaavn ↗", "text-link");
    link.href = song.perma_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    lyrics.append(link);
  }
  details.append(lyrics);
  card.append(image, details);
  result.replaceChildren(card);
};

const searchMusic = async (query) => {
  const status = document.querySelector("#music-status");
  const result = document.querySelector("#music-result");
  if (!status || !result) return;
  status.textContent = "Muziek wordt geladen...";
  result.replaceChildren();
  try {
    const endpoint = `https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(query)}&lyrics=true`;
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("API response was not successful");
    const songs = await response.json();
    const song = songs[0];
    if (!song) throw new Error("No song found");
    renderSong(song, result);
    status.textContent = `${songs.length} resultaat/resultaten gevonden.`;
  } catch (error) {
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

setupProjects();
renderBlogs();
setupContactForm();
setupMusic();
setupFooterContact();
