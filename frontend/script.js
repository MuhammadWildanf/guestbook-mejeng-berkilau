/* ===============================
   GLOBAL STATE
================================ */
let isSubmitting = false;
let currentChar = 1;

/* ===============================
   FORM SUBMIT
================================ */
const btnNext = document.getElementById("next");

btnNext.addEventListener("click", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const name = document.getElementById("name").value.trim();
  const comment = document.getElementById("comment").value.trim();
  const char = currentChar;

  if (!name || !comment || !char) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Isi semua kolom terlebih dahulu!",
    });
    return;
  }

  console.log("💾 SUBMIT DATA:", { name, char, comment });

  try {
    isSubmitting = true;
    btnNext.disabled = true;
    btnNext.textContent = "Memproses...";

    document.getElementById("p1").style.display = "none";
    document.getElementById("p2").style.display = "block";

    showSuccessPopup();
    await submitForm({ name, char, comment });
    showThankYouScreen({ name, char });
  } catch (err) {
    console.error("❌ SUBMIT ERROR:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Terjadi kesalahan saat menyimpan data",
    });
  } finally {
    isSubmitting = false;
    btnNext.disabled = false;
    btnNext.textContent = "MASUK";
  }
});

/* ===============================
   SUBMIT API
================================ */
async function submitForm(payload) {
  const res = await fetch("http://localhost:3002/submit-form", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ===============================
   UI HELPERS
================================ */
function showSuccessPopup() {
  Swal.fire({
    html: `
      <div style="
        width:260px;
        padding:25px;
        border-radius:18px;
        text-align:center;
        background:#339E7D;
        color:#fff;
        font-size:20px;
        font-weight:700;
      ">
        <div>Thank You</div>
        <div style="margin-top:8px;">For Your Participation!</div>
      </div>
    `,
    background: "transparent",
    showConfirmButton: false,
    timer: 1600,
  });
}

function showThankYouScreen({ name, char }) {
  document.getElementById("char-container").innerHTML = `
    <img src="/char/${char}.png" style="width:160px;margin-bottom:20px"/>
  `;
  document.getElementById("user-name").textContent = name;
}

/* ===============================
   CAROUSEL
================================ */
const wrapper = document.querySelector(".carousel-wrapper");
const carousel = document.querySelector(".carousel");
const arrowLeft = document.getElementById("left");
const arrowRight = document.getElementById("right");

let cards = [...carousel.children];
const cardWidth = cards[0].offsetWidth;
let isDragging = false;
let startX = 0;
let startScrollLeft = 0;

/* ---- Infinite Clone ---- */
const cardPerView = Math.round(carousel.offsetWidth / cardWidth);

cards.slice(-cardPerView).reverse().forEach(card => {
  carousel.insertAdjacentHTML("afterbegin", card.outerHTML);
});
cards.slice(0, cardPerView).forEach(card => {
  carousel.insertAdjacentHTML("beforeend", card.outerHTML);
});

carousel.scrollLeft = carousel.offsetWidth;

/* ---- Active by Center (drag/scroll) ---- */
function setActiveFromCenter(source) {
  const allCards = carousel.querySelectorAll(".card");
  const centerX =
    carousel.getBoundingClientRect().left + carousel.offsetWidth / 2;

  let closest = null;
  let minDist = Infinity;

  allCards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const dist = Math.abs(centerX - (rect.left + rect.width / 2));
    if (dist < minDist) {
      minDist = dist;
      closest = card;
    }
  });

  if (!closest) return;

  allCards.forEach(c => c.classList.remove("active"));
  closest.classList.add("active");

  currentChar = Number(closest.dataset.char);
  console.log(`🎯 ACTIVE (${source}) → char:`, currentChar);
}

/* ---- Infinite Scroll Fix ---- */
function infiniteScroll() {
  if (carousel.scrollLeft <= 0) {
    carousel.scrollLeft = carousel.scrollWidth - 2 * carousel.offsetWidth;
  } else if (
    Math.ceil(carousel.scrollLeft) >=
    carousel.scrollWidth - carousel.offsetWidth
  ) {
    carousel.scrollLeft = carousel.offsetWidth;
  }
}

/* ---- Arrow Control (STATE BASED) ---- */
function moveByArrow(direction) {
  const total = 5;
  currentChar += direction;
  if (currentChar > total) currentChar = 1;
  if (currentChar < 1) currentChar = total;

  const target = [...carousel.querySelectorAll(".card")]
    .find(c => Number(c.dataset.char) === currentChar);

  if (!target) return;

  const carouselRect = carousel.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const offset =
    targetRect.left -
    carouselRect.left -
    carousel.offsetWidth / 2 +
    target.offsetWidth / 2;

  carousel.scrollBy({ left: offset, behavior: "smooth" });

  carousel.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
  target.classList.add("active");

  console.log("➡️ ARROW → char:", currentChar);
}

arrowLeft.addEventListener("click", () => moveByArrow(-1));
arrowRight.addEventListener("click", () => moveByArrow(1));

/* ---- Drag ---- */
carousel.addEventListener("mousedown", e => {
  isDragging = true;
  startX = e.pageX;
  startScrollLeft = carousel.scrollLeft;
  carousel.classList.add("dragging");
});

document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  carousel.classList.remove("dragging");
  setActiveFromCenter("drag");
});

carousel.addEventListener("mousemove", e => {
  if (!isDragging) return;
  carousel.scrollLeft = startScrollLeft - (e.pageX - startX);
});

/* ---- Scroll ---- */
carousel.addEventListener("scroll", () => {
  infiniteScroll();
  if (!isDragging) setActiveFromCenter("scroll");
});

/* ---- Init ---- */
setTimeout(() => setActiveFromCenter("init"), 100);
