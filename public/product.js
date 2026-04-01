const UI_TEXT = {
  en: {
    loading: "Loading product...",
    notFound: "Product not found.",
    goCatalog: "Go back to catalog",
    back: "Back",
    askPrice: "Ask for price",
    materials: "Materials",
    stone: "Stone",
    sizes: "Sizes",
    contact: "Contact",
    contactText: "For availability, sizing and order details, contact us.",
    contactSeller: "Contact Seller",
    email: "Email",
    viewSellerPage: "View Seller Page"
  },
  tr: {
    loading: "Ürün yükleniyor...",
    notFound: "Ürün bulunamadı.",
    goCatalog: "Kataloğa geri dön",
    back: "Geri",
    askPrice: "Fiyat sorunuz",
    materials: "Materyaller",
    stone: "Taş",
    sizes: "Ölçüler",
    contact: "İletişim",
    contactText: "Stok, ölçü ve sipariş detayları için bizimle iletişime geçin.",
    contactSeller: "Satıcıyla İletişime Geç",
    email: "E-posta",
    viewSellerPage: "Satıcı Sayfasını Gör"
  }
};

const params = new URLSearchParams(window.location.search);
const productId = Number(params.get("id"));
const currentLang = params.get("lang") || localStorage.getItem("siteLang") || "en";

const contentEl = document.getElementById("productPageContent");
const backLink = document.getElementById("backLink");

function t(key) {
  return UI_TEXT[currentLang]?.[key] || UI_TEXT.en[key] || key;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeWhatsappNumber(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function normalizeApiProduct(product) {
  return {
    ...product,
    id: Number(product.id),
    name: product.name || "Untitled Product",
    description: product.description || "",
    category: product.category || "Other",
    subcategory: product.subcategory || "",
    price: product.price || "",
    materials: Array.isArray(product.materials) ? product.materials : [],
    stone: product.stone || "None",
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    images: Array.isArray(product.images) ? product.images : [],
    status: product.status || "available",
    isBestSeller: Boolean(product.isBestSeller),
    createdAt: product.createdAt || ""
  };
}

function translateStaticProduct(product) {
  if (currentLang === "tr") {
    const categoryMap = {
      Rings: "Yüzükler",
      Necklaces: "Kolyeler",
      Earrings: "Küpeler",
      Bracelets: "Bileklikler",
      Collections: "Setler"
    };

    const subcategoryMap = {
      Solitaire: "Tektaş",
      Baguette: "Baget Taşlı",
      "Colored Stones": "Renkli Taşlı",
      Fantasy: "Fantezi",
      Tennis: "Su Yolu"
    };

    return {
      ...product,
      category: categoryMap[product.category] || product.category,
      subcategory: subcategoryMap[product.subcategory] || product.subcategory
    };
  }

  return { ...product };
}

function renderError() {
  document.documentElement.lang = currentLang;
  document.title = "Product Detail - Liva Diamond";
  backLink.textContent = "← " + t("back");
  contentEl.className = "product-page-error";
  contentEl.innerHTML = `
    <p>${escapeHtml(t("notFound"))}</p>
    <p><a href="catalog.html">${escapeHtml(t("goCatalog"))}</a></p>
  `;
}

function renderProduct(product) {
  document.documentElement.lang = currentLang;
  document.title = `${product.name} - Liva Diamond`;
  backLink.textContent = "← " + t("back");

  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : ["https://via.placeholder.com/800x1000?text=No+Image"];

  const activeImage = images[0];

  contentEl.className = "product-page-shell";
  contentEl.innerHTML = `
    <div class="product-detail">
      <div>
        <div class="gallery-main">
          <img id="mainProductImage" src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}">
        </div>

        <div class="gallery-thumbs">
          ${images.map((img, index) => `
            <button class="thumb-btn ${index === 0 ? "active" : ""}" data-img="${escapeHtml(img)}">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)} thumbnail">
            </button>
          `).join("")}
        </div>
      </div>

      <div class="detail-panel">
        <h2>${escapeHtml(product.name)}</h2>
        <p class="detail-category">${escapeHtml(product.category)}</p>
        <p class="detail-price">${escapeHtml(product.price || t("askPrice"))}</p>

        <p class="detail-description">${escapeHtml(product.description || "")}</p>

        <div class="spec-list">
          <div class="spec-item">
            <strong>${escapeHtml(t("materials"))}</strong>
            <span>${escapeHtml((product.materials || []).join(", ") || "-")}</span>
          </div>

          <div class="spec-item">
            <strong>${escapeHtml(t("stone"))}</strong>
            <span>${escapeHtml(product.stone || "-")}</span>
          </div>

          <div class="spec-item">
            <strong>${escapeHtml(t("sizes"))}</strong>
            <span>${escapeHtml((product.sizes || []).join(", ") || "-")}</span>
          </div>
        </div>

        <div class="seller-box">
          <h3>${escapeHtml(t("contact"))}</h3>
          <p><strong>${escapeHtml(shopInfo?.brandName || "Liva Diamond")}</strong></p>
          <p>${escapeHtml(t("contactText"))}</p>
          <p>${escapeHtml(shopInfo?.instagram || "")}</p>

          <div class="seller-actions">
            <a
              class="primary"
              href="https://wa.me/${escapeHtml(sanitizeWhatsappNumber(shopInfo?.whatsappNumber || ""))}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${escapeHtml(t("contactSeller"))}
            </a>

            <a href="mailto:${escapeHtml(shopInfo?.email || "")}">
              ${escapeHtml(t("email"))}
            </a>

            <a href="${escapeHtml(shopInfo?.aboutPageUrl || "about.html")}">
              ${escapeHtml(t("viewSellerPage"))}
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const mainImage = document.getElementById("mainProductImage");
  contentEl.querySelectorAll(".thumb-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = btn.dataset.img;
      mainImage.src = img;

      contentEl.querySelectorAll(".thumb-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  mainImage.addEventListener("click", () => {
    const currentSrc = mainImage.src;
    const startIdx = images.findIndex((i) => currentSrc.endsWith(i) || i === currentSrc);
    openLightbox(images, startIdx >= 0 ? startIdx : 0);
  });
}

function openLightbox(images, startIndex) {
  let idx = startIndex ?? 0;

  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";

  const img = document.createElement("img");

  const close = document.createElement("button");
  close.className = "lightbox-close";
  close.innerHTML = "&times;";
  close.setAttribute("aria-label", "Close");

  const prev = document.createElement("button");
  prev.className = "lightbox-nav prev";
  prev.innerHTML = "&#8249;";

  const next = document.createElement("button");
  next.className = "lightbox-nav next";
  next.innerHTML = "&#8250;";

  function show(i) {
    idx = ((i % images.length) + images.length) % images.length;
    img.src = images[idx];
    prev.classList.toggle("lb-hidden", images.length <= 1);
    next.classList.toggle("lb-hidden", images.length <= 1);
  }

  show(idx);
  overlay.append(close, prev, img, next);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";

  function closeLb() {
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLb(); });
  close.addEventListener("click", closeLb);
  prev.addEventListener("click", (e) => { e.stopPropagation(); show(idx - 1); });
  next.addEventListener("click", (e) => { e.stopPropagation(); show(idx + 1); });
  document.addEventListener("keydown", onKey);
}

async function loadProduct() {
  if (!productId) {
    renderError();
    return;
  }

  try {
    const res = await fetch(`/api/products?lang=${currentLang}`);
    let apiProducts = [];

    if (res.ok) {
      const data = await res.json();
      apiProducts = Array.isArray(data) ? data.map(normalizeApiProduct) : [];
    }

    const staticProducts = Array.isArray(window.products)
      ? window.products.map((p) => translateStaticProduct(p))
      : [];

    const allProducts = [...staticProducts, ...apiProducts];
    const product = allProducts.find((p) => Number(p.id) === productId);

    if (!product) {
      renderError();
      return;
    }

    renderProduct(product);
  } catch (err) {
    console.error("Product page load error:", err);

    const staticProducts = Array.isArray(window.products)
      ? window.products.map((p) => translateStaticProduct(p))
      : [];

    const product = staticProducts.find((p) => Number(p.id) === productId);

    if (!product) {
      renderError();
      return;
    }

    renderProduct(product);
  }
}

contentEl.textContent = t("loading");
loadProduct();