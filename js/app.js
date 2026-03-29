let allFilms = [];
let displayed = [];
let maxBoxOffice = 0;

const tbody = document.getElementById("filmsBody");
const searchInput = document.getElementById("searchInput");
const yearFrom = document.getElementById("yearFrom");
const yearTo = document.getElementById("yearTo");
const sortSelect = document.getElementById("sortSelect");
const resetBtn = document.getElementById("resetBtn");
const resultsCount = document.getElementById("resultsCount");

const statTotal = document.getElementById("statTotal");
const statHighest = document.getElementById("statHighest");
const statOldest = document.getElementById("statOldest");
const statNewest = document.getElementById("statNewest");


const modalBackdrop = document.getElementById("modalBackdrop");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");


function usd(n) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}


function renderTable() {
  tbody.innerHTML = "";

  displayed.forEach((film, idx) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${film.title || "—"}</td>
      <td>${film.release_year ?? "—"}</td>
      <td>${film.director || "—"}</td>
      <td>${usd(film.box_office)}</td>
      <td>${film.country || "—"}</td>
    `;

    tr.addEventListener("click", () => openModal(film));

    tbody.appendChild(tr);
  });

  resultsCount.textContent = `Showing ${displayed.length} of ${allFilms.length} films`;
}


function populateStats() {
  statTotal.textContent = allFilms.length;

  const highest = allFilms.reduce(
    (max, f) => (f.box_office > max.box_office ? f : max),
    allFilms[0]
  );

  maxBoxOffice = highest.box_office;

  statHighest.textContent = usd(highest.box_office);

  const years = allFilms.map(f => f.release_year).filter(Boolean);
  statOldest.textContent = Math.min(...years);
  statNewest.textContent = Math.max(...years);
}


function openModal(film) {
  const percent = ((film.box_office || 0) / maxBoxOffice * 100).toFixed(1);

  modalContent.innerHTML = `
    <div class="modal-title">${film.title}</div>
    <div class="modal-year">${film.release_year}</div>

    <div class="modal-info">
      🎬 ${film.director || "—"}<br/>
      🌍 ${film.country || "—"}
    </div>

    <div><strong>${usd(film.box_office)}</strong></div>

    <div class="gross-bar">
      <div class="gross-track">
        <div class="gross-fill" data-width="${percent}%">
          ${percent}%
        </div>
      </div>
    </div>
  `;

  modalBackdrop.classList.add("open");
  document.body.style.overflow = "hidden";


  setTimeout(() => {
    const fill = document.querySelector(".gross-fill");
    if (fill) fill.style.width = fill.dataset.width;
  }, 100);
}

function closeModal() {
  modalBackdrop.classList.remove("open");
  document.body.style.overflow = "";
}

modalClose.addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});


function applyFilters() {
  const q = searchInput.value.toLowerCase().trim();
  const fromY = yearFrom.value ? parseInt(yearFrom.value) : null;
  const toY = yearTo.value ? parseInt(yearTo.value) : null;

  displayed = allFilms.filter(f => {
    if (q) {
      const haystack = [f.title, f.director, f.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    if (fromY && f.release_year && f.release_year < fromY) return false;
    if (toY && f.release_year && f.release_year > toY) return false;

    return true;
  });

  applySort();
}


function applySort() {
  const key = sortSelect.value;

  displayed.sort((a, b) => {
    switch (key) {
      case "box_office_desc":
        return (b.box_office ?? 0) - (a.box_office ?? 0);
      case "box_office_asc":
        return (a.box_office ?? 0) - (b.box_office ?? 0);
      case "year_desc":
        return (b.release_year ?? 0) - (a.release_year ?? 0);
      case "year_asc":
        return (a.release_year ?? 0) - (b.release_year ?? 0);
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return 0;
    }
  });

  renderTable();
}


document.querySelectorAll("#filmsTable th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const col = th.dataset.sort;

    const map = {
      title: ["title_asc", "title_desc"],
      release_year: ["year_asc", "year_desc"],
      box_office: ["box_office_desc", "box_office_asc"],
      director: ["title_asc", "title_desc"],
      country: ["title_asc", "title_desc"],
    };

    const opts = map[col] || ["title_asc", "title_desc"];

    sortSelect.value =
      sortSelect.value === opts[0] ? opts[1] : opts[0];

    applySort();
  });
});


searchInput.addEventListener("input", applyFilters);
yearFrom.addEventListener("input", applyFilters);
yearTo.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applySort);

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  yearFrom.value = "";
  yearTo.value = "";
  sortSelect.value = "box_office_desc";

  displayed = [...allFilms];
  applySort();
});


fetch("data/films.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    allFilms = data;
    displayed = [...allFilms];

    populateStats();
    applySort();
  })
  .catch(err => {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:#f87171;padding:2rem;">
          ⚠ Failed to load film data.<br>${err.message}
        </td>
      </tr>
    `;
    console.error(err);
  });