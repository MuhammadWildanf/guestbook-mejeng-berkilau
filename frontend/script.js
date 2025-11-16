let isSubmitting = false;

document.getElementById("next").addEventListener("click", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  const btnNext = document.getElementById("next");
  const name = document.getElementById("name").value.trim();
  const comment = document.getElementById("comment").value.trim();

  if (!name || !comment) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Isi semua kolom terlebih dahulu!",
    });
    return;
  }

  isSubmitting = true;
  btnNext.disabled = true;
  btnNext.textContent = "Memproses...";

  document.getElementById("p2").style.display = "block";
  document.getElementById("p1").style.display = "none";

  Swal.fire({
    html: `
    <div style="
      width: 260px;
      padding: 25px 20px;
      border-radius: 18px;
      text-align: center;
      font-family: 'Orbitron', sans-serif;
      background: linear-gradient(180deg, #ff62b0, #7a20ff);
      color: white;
      font-size: 20px;
      font-weight: 700;
      position: relative;
      box-shadow:
        0 0 40px rgba(255, 0, 140, 0.5),
        0 0 80px rgba(120, 0, 255, 0.4),
        0 0 120px rgba(255, 0, 120, 0.4);
    ">
      <div>Thank You</div>
      <div style="margin-top: 8px;">For Your Participation!</div>
    </div>
  `,
    background: "transparent",
    showConfirmButton: false,
    timer: 1600,
    customClass: {
      popup: "no-border-shadow",
    }
  });


  try {
    await submit(name, char, comment);
  } finally {
    // Setelah selesai, bisa diaktifkan lagi kalau mau
    isSubmitting = false;
    btnNext.disabled = false;
    btnNext.textContent = "MASUK";
  }
});

async function submit(name, char, comment) {
  try {
    const response = await fetch("https://entertaiment-week-africa.vercel.app/submit-form", {
      // const response = await fetch("http://localhost:3000/submit-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, char, comment }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorMessage}`
      );
    }

    const responseData = await response.json();
    console.log("Response Data:", responseData);

    showThankYouScreen({ name, char });
  } catch (error) {
    console.error("Error submitting data:", error.message || error);
  }
}

function showThankYouScreen(data) {
  const { name, char } = data;

  // Tampilkan gambar karakter
  const imageUrl = `/char/${char}.png`;
  const charImg = document.createElement('img');
  charImg.src = imageUrl;
  charImg.alt = char;
  charImg.style.width = "160px";
  charImg.style.display = "block";
  charImg.style.margin = "0 auto 20px";

  const charContainer = document.getElementById("char-container");
  charContainer.innerHTML = "";
  charContainer.appendChild(charImg);

  // Set nama user di tengah
  const userName = document.getElementById("user-name");
  userName.textContent = name;

  // Tampilkan layar
  const p2 = document.getElementById("p2");
  p2.style.display = "flex";
  p2.style.flexDirection = "column";
  p2.style.alignItems = "center";
}

const wrapper = document.querySelector(".carousel-wrapper");
const carousel = document.querySelector(".carousel");
const firstCardWidth = carousel.querySelector(".card").offsetWidth;
const arrowBtns = document.querySelectorAll(".carousel-wrapper i");
// const arrowBtns = document.querySelectorAll(".carousel-wrapper .arrow-btn");
const carouselChildrens = [...carousel.children];

let char = 1;
let isDragging = false,
  startX,
  startScrollLeft,
  timeoutId;

// Get the number of cards that can fit in the carousel at once
let cardPerView = Math.round(carousel.offsetWidth / firstCardWidth);

// Infinite scrolling setup
carouselChildrens
  .slice(-cardPerView)
  .reverse()
  .forEach((card) => {
    carousel.insertAdjacentHTML("afterbegin", card.outerHTML);
  });
carouselChildrens.slice(0, cardPerView).forEach((card) => {
  carousel.insertAdjacentHTML("beforeend", card.outerHTML);
});

carousel.classList.add("no-transition");
carousel.scrollLeft = carousel.offsetWidth;
carousel.classList.remove("no-transition");

// Update char function
const updateChar = () => {
  char =
    Math.round(carousel.scrollLeft / firstCardWidth) %
    carouselChildrens.length || carouselChildrens.length;
  console.log("Current char after scroll/drag:", char);
};

// Arrow button click events
arrowBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    carousel.scrollLeft += btn.id === "left" ? -firstCardWidth : firstCardWidth;

    if (char > 1 && char < 10) {
      char += btn.id === "left" ? -1 : 1;
    } else if (char === 1) {
      char = btn.id === "left" ? 10 : 2;
    } else if (char === 10) {
      char = btn.id === "left" ? 9 : 1;
    }

    updateChar();
  });
});

// Drag events
const dragStart = (e) => {
  isDragging = true;
  carousel.classList.add("dragging");
  startX = e.pageX;
  startScrollLeft = carousel.scrollLeft;
};

const dragging = (e) => {
  if (!isDragging) return;
  carousel.scrollLeft = startScrollLeft - (e.pageX - startX);
};

const dragStop = () => {
  if (isDragging) updateChar();
  isDragging = false;
  carousel.classList.remove("dragging");
};

const infiniteScroll = () => {
  if (carousel.scrollLeft === 0) {
    carousel.classList.add("no-transition");
    carousel.scrollLeft = carousel.scrollWidth - 2 * carousel.offsetWidth;
    carousel.classList.remove("no-transition");
  } else if (
    Math.ceil(carousel.scrollLeft) ===
    carousel.scrollWidth - carousel.offsetWidth
  ) {
    carousel.classList.add("no-transition");
    carousel.scrollLeft = carousel.offsetWidth;
    carousel.classList.remove("no-transition");
  }
  updateChar();
};

// Event listeners
carousel.addEventListener("mousedown", dragStart);
carousel.addEventListener("mousemove", dragging);
document.addEventListener("mouseup", dragStop);
carousel.addEventListener("scroll", infiniteScroll);
wrapper.addEventListener("mouseenter", () => clearTimeout(timeoutId));
