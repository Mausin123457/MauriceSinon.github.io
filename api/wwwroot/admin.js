const status = document.querySelector("#status");
const loginForm = document.querySelector("#login-form");
const panel = document.querySelector("#admin-panel");
let csrfTokenValue;
const csrfTokenFromCookie = () => document.cookie
  .split(";")
  .map((item) => item.trim())
  .find((item) => item.startsWith("maurice-csrf="))
  ?.slice("maurice-csrf=".length);
const ensureCsrfToken = async () => {
  if (csrfTokenValue) return csrfTokenValue;
  const response = await fetch("/api/admin/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error(`CSRF token request failed (${response.status})`);
  const data = await response.json();
  csrfTokenValue = data.token || csrfTokenFromCookie();
  if (!csrfTokenValue) throw new Error("CSRF token was not provided by the server");
  return csrfTokenValue;
};
const request = async (url, options = {}) => {
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) };
  if (options.method && options.method !== "GET" && url !== "/api/admin/login") {
    headers["X-CSRF-TOKEN"] = await ensureCsrfToken();
  }
  const response = await fetch(url, { credentials: "same-origin", ...options, headers });
  if (response.status === 403 && options.method && options.method !== "GET" && url !== "/api/admin/login") {
    csrfTokenValue = undefined;
    headers["X-CSRF-TOKEN"] = await ensureCsrfToken();
    const retry = await fetch(url, { credentials: "same-origin", ...options, headers });
    if (!retry.ok) throw new Error((await retry.text()) || `Request failed (${retry.status})`);
    return retry.status === 204 ? null : retry.json();
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
};
const showError = (error) => { status.textContent = error.message; status.className = "error"; };
const resetForm = (form) => { form.reset(); form.elements.id.value = ""; };
const toInputDate = (value) => new Date(value).toISOString().slice(0, 16);

async function loadData() {
  const [projects, blogs] = await Promise.all([request("/api/projects"), request("/api/blogposts")]);
  document.querySelector("#projects").replaceChildren(...projects.map((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.title} (${item.category}) `;
    const edit = document.createElement("button"); edit.textContent = "Edit"; edit.type = "button";
    edit.onclick = () => { const form = document.querySelector("#project-form"); form.elements.id.value = item.id; form.elements.title.value = item.title; form.elements.category.value = item.category; form.elements.description.value = item.description; form.elements.githubUrl.value = item.gitHubUrl || ""; form.elements.date.value = toInputDate(item.date); };
    const remove = document.createElement("button"); remove.textContent = "Delete"; remove.type = "button";
    remove.onclick = async () => { if (confirm(`Delete ${item.title}?`)) { await request(`/api/projects/${item.id}`, { method: "DELETE" }); await loadData(); } };
    li.append(edit, remove); return li;
  }));
  document.querySelector("#blogs").replaceChildren(...blogs.map((item) => {
    const li = document.createElement("li"); li.textContent = `${item.title} `;
    const edit = document.createElement("button"); edit.textContent = "Edit"; edit.type = "button";
    edit.onclick = () => { const form = document.querySelector("#blog-form"); form.elements.id.value = item.id; form.elements.title.value = item.title; form.elements.content.value = item.content; form.elements.publicationDate.value = toInputDate(item.publicationDate); };
    const remove = document.createElement("button"); remove.textContent = "Delete"; remove.type = "button";
    remove.onclick = async () => { if (confirm(`Delete ${item.title}?`)) { await request(`/api/blogposts/${item.id}`, { method: "DELETE" }); await loadData(); } };
    li.append(edit, remove); return li;
  }));
}

loginForm.onsubmit = async (event) => {
  event.preventDefault();
  try {
    const data = Object.fromEntries(new FormData(loginForm));
    await request("/api/admin/login", { method: "POST", body: JSON.stringify(data) });
    csrfTokenValue = undefined;
    loginForm.classList.add("hidden"); panel.classList.remove("hidden"); status.textContent = `Logged in as ${data.username}`; await loadData();
  } catch (error) { showError(error); }
};
document.querySelector("#logout").onclick = async () => { await request("/api/admin/logout", { method: "POST" }); panel.classList.add("hidden"); loginForm.classList.remove("hidden"); };
document.querySelector("#project-form").onsubmit = async (event) => { event.preventDefault(); try { const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); delete data.id; data.date = new Date(data.date).toISOString(); const id = form.elements.id.value; await request(id ? `/api/projects/${id}` : "/api/projects", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }); resetForm(form); await loadData(); } catch (error) { showError(error); } };
document.querySelector("#blog-form").onsubmit = async (event) => { event.preventDefault(); try { const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); delete data.id; data.publicationDate = new Date(data.publicationDate).toISOString(); const id = form.elements.id.value; await request(id ? `/api/blogposts/${id}` : "/api/blogposts", { method: id ? "PUT" : "POST", body: JSON.stringify(data) }); resetForm(form); await loadData(); } catch (error) { showError(error); } };
document.querySelector("#cancel-project").onclick = () => resetForm(document.querySelector("#project-form"));
document.querySelector("#cancel-blog").onclick = () => resetForm(document.querySelector("#blog-form"));
