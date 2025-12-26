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
  const res = await fetch("https://guestbook-mejeng-berkilau.vercel.app/submit-form", {
    // const res = await fetch("http://localhost:3002/submit-form", {
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

// Get original cards and dimensions
const originalCards = [...carousel.querySelectorAll(".card")];
const totalOriginal = originalCards.length;
// We must account for the GAP and Padding to be precise!
const computedStyle = window.getComputedStyle(carousel);
const gap = parseFloat(computedStyle.gap) || 0;
const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
const cardWidth = originalCards[0].offsetWidth;
const stride = cardWidth + gap; // The actual distance from one card start to the next

// Clone for infinite scroll (clone all to be safe and smooth)
originalCards.forEach(card => {
  const cloneStart = card.cloneNode(true);
  const cloneEnd = card.cloneNode(true);
  cloneStart.classList.add('clone');
  cloneEnd.classList.add('clone');
});

// We need enough buffer. simpler approach: duplicate the whole set at start and end.
originalCards.forEach(card => carousel.insertAdjacentHTML("afterbegin", card.outerHTML));
originalCards.forEach(card => carousel.insertAdjacentHTML("beforeend", card.outerHTML));

// New card list (clones + originals)
const allCards = carousel.querySelectorAll(".card");

// Rebuild safely to ensure order is [Set][Set (Real)][Set]
carousel.innerHTML = "";
originalCards.forEach(card => carousel.appendChild(card.cloneNode(true))); // Set 1 (Buffer Left)
originalCards.forEach(card => {
  const el = card.cloneNode(true);
  el.classList.add('original-ref'); // Mark real ones
  carousel.appendChild(el);
}); // Set 2 (Real Middle)
originalCards.forEach(card => carousel.appendChild(card.cloneNode(true))); // Set 3 (Buffer Right)

// Update selector
let cards = carousel.querySelectorAll(".card");

// Set start position: The start of the Middle Set (index * stride)
// We align it such that the first real card is properly placed.
// The scroll position for index 0 of the middle set is: totalOriginal * stride
const startScrollPos = totalOriginal * stride;
carousel.scrollLeft = startScrollPos;

let isDragging = false;
let startX, startScrollLeft;
let timeoutId;

/* ---- Scroll Handler (Infinite Loop + Active State) ---- */
const infiniteScroll = () => {
  // If at the very start (left buffer end), jump to middle
  if (carousel.scrollLeft <= 0) {
    carousel.classList.add("no-transition");
    carousel.scrollLeft = carousel.scrollLeft + (totalOriginal * stride);
    carousel.classList.remove("no-transition");
  }
  // If at the very end (right buffer start), jump to middle
  else if (carousel.scrollLeft >= (carousel.scrollWidth - carousel.offsetWidth)) {
    carousel.classList.add("no-transition");
    carousel.scrollLeft = carousel.scrollLeft - (totalOriginal * stride);
    carousel.classList.remove("no-transition");
  }

  // Calculate Active Character
  // Center of the view = scrollLeft + (viewWidth/2)
  // We want to know which card's center is closest to this.
  // Card center relative to start = (index * stride) + (cardWidth/2) + paddingLeft
  // It's easier to just map scrollLeft to an index since we have equal strides.

  // Adjusted Scroll = scrollLeft basically tracks the left edge of the content.
  // The first card starts at `paddingLeft`.
  // So: roundedIndex = (scrollLeft) / stride. 
  // But wait, the snap alignment centers the card.

  const centerPos = carousel.scrollLeft + (carousel.offsetWidth / 2);
  // We offset by paddingLeft to find "distance into the card track"
  const trackPos = centerPos - paddingLeft;
  // Each card occupies 'stride' space, centered at stride/2? No.
  // Card N starts at N * stride. Center is N * stride + cardWidth/2.

  const activeIndex = Math.floor(trackPos / stride);

  const rawIndex = activeIndex % totalOriginal;
  let newChar = rawIndex + 1;

  // Bounds check (rare edge cases with buffers)
  if (newChar < 1) newChar = 1;
  if (newChar > 5) newChar = 1;

  // Update Global State
  // We ALWAYS update visual state to ensure restarts don't lose highlight
  if (true) {
    if (currentChar !== newChar) {
      currentChar = newChar;
      console.log(`✅ SELECTED CHARACTER: ${currentChar}`);
    }

    // Visual Update: Highlight ALL Match Clones
    // This prevents flickering when the scroll position resets (jumps) 
    // because the 'target' clone at the new position will ALREADY be active.
    cards.forEach(c => {
      c.classList.remove("active");
      if (parseInt(c.dataset.char) === currentChar) {
        c.classList.add("active");
      }
    });
  }
}


carousel.addEventListener("scroll", infiniteScroll);

/* ---- Arrows ---- */
arrowLeft.addEventListener("click", () => {
  carousel.scrollBy({ left: -stride, behavior: "smooth" });
});

arrowRight.addEventListener("click", () => {
  carousel.scrollBy({ left: stride, behavior: "smooth" });
});

/* ---- Drag ---- */
carousel.addEventListener("mousedown", (e) => {
  isDragging = true;
  carousel.classList.add("dragging");
  startX = e.pageX;
  startScrollLeft = carousel.scrollLeft;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  carousel.classList.remove("dragging");
  snapToNearest();
});

carousel.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX;
  const walk = (x - startX);
  carousel.scrollLeft = startScrollLeft - walk;
});

// Touch support with Passive: false fix
carousel.addEventListener("touchstart", (e) => {
  isDragging = true;
  carousel.classList.add("dragging");
  startX = e.touches[0].pageX;
  startScrollLeft = carousel.scrollLeft;
}, { passive: false });

document.addEventListener("touchend", () => {
  isDragging = false;
  carousel.classList.remove("dragging");
  snapToNearest();
});

carousel.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  // We want to prevent default to stop page scrolling while dragging carousel
  e.preventDefault();
  const x = e.touches[0].pageX;
  const walk = (x - startX);
  carousel.scrollLeft = startScrollLeft - walk;
}, { passive: false });


function snapToNearest() {
  // Smooth snap to nearest card stride
  const currentScroll = carousel.scrollLeft;
  const nearestIndex = Math.round(currentScroll / stride);
  carousel.scrollTo({
    left: nearestIndex * stride,
    behavior: "smooth"
  });
}

// Init active state
// Add 'no-transition' class to css if not exists to support instant jumps
// For now we just assume clean scroll.
infiniteScroll();
