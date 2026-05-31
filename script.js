const contractButton = document.querySelector(".contract-value");

function copyText(value) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value).catch(() => fallbackCopyText(value));
  }

  return fallbackCopyText(value);
}

function fallbackCopyText(value) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  document.body.removeChild(field);

  return Promise.resolve();
}

if (contractButton) {
  const originalLabel = contractButton.querySelector("strong").textContent;

  contractButton.addEventListener("click", async () => {
    const contract = contractButton.dataset.contract;
    const label = contractButton.querySelector("strong");

    try {
      await copyText(contract);
      label.textContent = "Copied";
    } catch {
      label.textContent = "Copy error";
    }

    window.setTimeout(() => {
      label.textContent = originalLabel;
    }, 1400);
  });
}

const loreVideoFrame = document.querySelector(".video-frame");
const loreVideo = loreVideoFrame?.querySelector("video");
const lorePlayButton = loreVideoFrame?.querySelector(".video-play-button");

if (loreVideoFrame && loreVideo && lorePlayButton) {
  lorePlayButton.addEventListener("click", () => {
    loreVideo.controls = true;
    loreVideoFrame.classList.add("is-playing");
    loreVideo.play().catch(() => {
      loreVideo.controls = true;
    });
  });

  loreVideo.addEventListener("click", () => {
    loreVideo.controls = true;
  });

  loreVideo.addEventListener("play", () => {
    loreVideoFrame.classList.add("is-playing");
    loreVideo.controls = true;
  });

  loreVideo.addEventListener("pause", () => {
    if (loreVideo.currentTime === 0 || loreVideo.ended) {
      loreVideoFrame.classList.remove("is-playing");
    }
  });
}

const memeIds = [
  1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 38, 39, 40, 41, 42, 43,
  44, 45, 47, 49, 50, 51, 53, 54, 56, 57, 58, 59, 60, 61, 62, 64, 65, 66,
  68, 70, 71, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87,
  88, 91, 92, 93, 95, 97, 98, 99, 100, 101, 102, 103, 104, 106, 108, 109,
  110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
  124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 137, 138,
  139, 140, 141, 142, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153,
  154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167,
  168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181,
  182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195,
  196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209,
  210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223,
  224, 225, 226, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239,
  240, 241,
];

const memeImages = memeIds.map((id) => `assets/memes/meme_${id}.jpg`);

const fanArtTiles = [...document.querySelectorAll(".fan-art-tile img")];

function randomMeme(excluded = "") {
  let next = excluded;

  while (next === excluded) {
    next = memeImages[Math.floor(Math.random() * memeImages.length)];
  }

  return next;
}

function rotateFanArtImage(image, delay = 0) {
  window.setTimeout(() => {
    image.classList.add("is-fading");

    window.setTimeout(() => {
      image.src = randomMeme(image.getAttribute("src"));
      image.classList.remove("is-fading");
      rotateFanArtImage(image, 2600 + Math.random() * 5200);
    }, 520);
  }, delay);
}

fanArtTiles.forEach((image, index) => {
  image.addEventListener("error", () => {
    image.src = randomMeme(image.getAttribute("src"));
  });

  rotateFanArtImage(image, 1400 + index * 650 + Math.random() * 1600);
});
