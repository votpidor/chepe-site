const contractButton = document.querySelector(".contract-value");
const statMarketCap = document.querySelector("[data-stat-mcap]");
const statHolders = document.querySelector("[data-stat-holders]");
const statAge = document.querySelector("[data-stat-age]");
const statDevBalance = document.querySelector("[data-stat-dev-balance]");
const topWallets = document.querySelector("[data-top-wallets]");
const milestoneHidden = document.querySelector("[data-milestone-hidden]");
const milestoneToggle = document.querySelector("[data-milestone-toggle]");
const accordionCards = [...document.querySelectorAll("[data-accordion-card]")];
const heroLogo = document.querySelector("#heroLogo");

const heroLogos = [
  "assets/headlogo/1.png",
  "assets/headlogo/2.png",
  "assets/headlogo/3.png",
  "assets/headlogo/4.png",
];

if (heroLogo && heroLogos.length) {
  let logoIndex = Math.floor(Math.random() * heroLogos.length);
  heroLogo.src = heroLogos[logoIndex];

  preloadHeroLogos(heroLogos).then(() => {
    setInterval(() => {
      heroLogo.classList.add("is-changing");

      window.setTimeout(() => {
        logoIndex = (logoIndex + 1) % heroLogos.length;
        heroLogo.src = heroLogos[logoIndex];
        heroLogo.classList.remove("is-changing");
      }, 260);
    }, 2000);
  });
}

function preloadHeroLogos(sources) {
  return Promise.allSettled(
    sources.map((source) => {
      const image = new Image();
      image.src = source;

      if (image.decode) {
        return image.decode().catch(() => undefined);
      }

      return new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    }),
  );
}
const tokenDeployTimestamp = 1779697837;
const tokenTotalSupply = 100000000;
const tokenSupplyRaw = BigInt(tokenTotalSupply) * 1000000000n;

function formatMarketCap(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000000 ? 1 : 0,
    notation: value >= 1000000 ? "compact" : "standard",
  });

  return `$${formatter.format(value)}`;
}

async function loadTokenStats() {
  try {
    const [dexData, geckoData, jettonData, devData, poolData, tonRateData] = await Promise.all([
      requestJson(
        "https://api.dexscreener.com/latest/dex/pairs/ton/eqdhqtk_seftl95gj3ciukmkwnoog_i-bdv9jzrbovb7rshe",
      ),
      requestJson(
        "https://api.geckoterminal.com/api/v2/networks/ton/pools/EQDhQtK_SEFTL95gJ3CiukMKWnOog_i-bDV9JzRBoVB7RshE",
      ),
      requestJson("https://tonapi.io/v2/jettons/EQBxjNmwpTzSMDI6-_X2ad78fwnvZXxdHSzNyx_0wl5n24S5"),
      requestJson("https://tonapi.io/v2/accounts/0:0edd4b475d9340d8c1c8427804f841fd09a766bd8302c0d95181392dd55e9948"),
      requestJson("https://tonapi.io/v2/blockchain/accounts/0:989693bf00fd01f924f18995a5f29ebc12928d6549836dd9fa08e9f2c529c8ff/methods/get_pool_data"),
      requestJson("https://tonapi.io/v2/rates?tokens=ton&currencies=usd"),
    ]);
    const marketCap = resolveMarketCap(dexData, geckoData, poolData, tonRateData);

    if (statMarketCap) {
      statMarketCap.textContent = formatMarketCap(marketCap);
    }

    if (statHolders && jettonData.holders_count) {
      statHolders.textContent = new Intl.NumberFormat("en-US").format(jettonData.holders_count);
    }

    if (statAge) {
      statAge.textContent = formatTokenAgeShort(tokenDeployTimestamp);
    }

    if (statDevBalance && Number.isFinite(devData.balance)) {
      statDevBalance.textContent = `${formatTonBalance(devData.balance)} TON`;
    }
  } catch {
    if (statAge) {
      statAge.textContent = formatTokenAgeShort(tokenDeployTimestamp);
    }
  }
}

loadTokenStats();

function resolveMarketCap(dexData, geckoData, poolData, tonRateData) {
  const pair = dexData.pair ?? dexData.pairs?.[0];
  const dexMarketCap = Number(pair?.marketCap ?? pair?.fdv);

  if (Number.isFinite(dexMarketCap) && dexMarketCap > 0) {
    return dexMarketCap;
  }

  const dexPriceUsd = Number(pair?.priceUsd);

  if (Number.isFinite(dexPriceUsd) && dexPriceUsd > 0) {
    return dexPriceUsd * tokenTotalSupply;
  }

  const geckoMarketCap = Number(geckoData.data?.attributes?.market_cap_usd ?? geckoData.data?.attributes?.fdv_usd);

  if (Number.isFinite(geckoMarketCap) && geckoMarketCap > 0) {
    return geckoMarketCap;
  }

  const geckoPriceUsd = Number(geckoData.data?.attributes?.base_token_price_usd);

  if (Number.isFinite(geckoPriceUsd) && geckoPriceUsd > 0) {
    return geckoPriceUsd * tokenTotalSupply;
  }

  const reserveToken = Number(poolData.decoded?.reserve_x) / 1000000000;
  const reserveTon = Number(poolData.decoded?.reserve_y) / 1000000000;
  const tonUsd = Number(tonRateData.rates?.TON?.prices?.USD);

  if (reserveToken > 0 && reserveTon > 0 && tonUsd > 0) {
    return (reserveTon / reserveToken) * tonUsd * tokenTotalSupply;
  }

  return Number.NaN;
}

async function loadTopHolders() {
  if (!topWallets) {
    return;
  }

  try {
    const holderData = await requestJson(
      "https://tonapi.io/v2/jettons/EQBxjNmwpTzSMDI6-_X2ad78fwnvZXxdHSzNyx_0wl5n24S5/holders?limit=40&offset=0",
    );
    const wallets = (holderData.addresses ?? [])
      .filter((holder) => holder.owner?.is_wallet)
      .slice(0, 13);
    const items = wallets.map(
      (wallet, index) => `<strong><em>${index + 1}</em> ${formatHolderPercent(wallet.balance)}</strong>`,
    );

    topWallets.innerHTML = `<span>Top wallets</span>${items.join("")}`;
  } catch {
    // Keep the static fallback values if the public API is not reachable.
  }
}

loadTopHolders();

function setOpenAccordion(cardToOpen) {
  accordionCards.forEach((card) => {
    card.classList.toggle("is-open", card === cardToOpen);
  });
}

if (accordionCards.length) {
  const hashCard = accordionCards.find((card) => `#${card.id}` === window.location.hash);
  setOpenAccordion(hashCard ?? null);

  accordionCards.forEach((card) => {
    const toggle = card.querySelector("[data-accordion-toggle]");

    toggle?.addEventListener("click", () => {
      const shouldClose = card.classList.contains("is-open");
      setOpenAccordion(shouldClose ? null : card);
    });
  });

  window.addEventListener("hashchange", () => {
    const activeCard = accordionCards.find((card) => `#${card.id}` === window.location.hash);

    if (activeCard) {
      setOpenAccordion(activeCard);
    }
  });
}

if (milestoneHidden && milestoneToggle) {
  milestoneToggle.addEventListener("click", () => {
    const isOpen = milestoneHidden.classList.toggle("is-open");
    milestoneToggle.textContent = isOpen ? "Hide middle" : "Show full diary";
  });
}

function formatTokenAge(timestamp) {
  const diff = Date.now() - timestamp * 1000;
  const days = Math.max(0, Math.floor(diff / 86400000));

  if (days < 1) {
    return "Today";
  }

  return `${days} day${days === 1 ? "" : "s"}`;
}

function formatTokenAgeShort(timestamp) {
  const diff = Date.now() - timestamp * 1000;
  const days = Math.max(0, Math.floor(diff / 86400000));

  if (days < 1) {
    return "Today";
  }

  return `${days}d`;
}

function formatTonBalance(nanoTons) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(nanoTons / 1000000000);
}

function formatHolderPercent(rawBalance) {
  const percent = (Number(BigInt(rawBalance) * 10000n / tokenSupplyRaw) / 100).toFixed(2);

  return `${percent}%`;
}

function requestJson(url) {
  if (typeof fetch === "function") {
    return fetch(url).then((response) => response.json());
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("GET", url);
    request.responseType = "json";

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response ?? JSON.parse(request.responseText));
      } else {
        reject(new Error(`Request failed with ${request.status}`));
      }
    };

    request.onerror = reject;
    request.send();
  });
}

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
