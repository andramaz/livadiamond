// ---------- DOM ----------
const productGrid = document.getElementById("productGrid");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryChips = document.getElementById("categoryChips");
const sortSelect = document.getElementById("sortSelect");

const productModal = document.getElementById("productModal");
const modalContent = document.getElementById("modalContent");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");

const menuBtn = document.getElementById("menuBtn");
const mobileNav = document.getElementById("mobileNav");
const newestGrid = document.getElementById("newestGrid");
const bestSellerGrid = document.getElementById("bestSellerGrid");

const newArrivalsSection = document.getElementById("newArrivalsSection");
const bestSellersSection = document.getElementById("bestSellersSection");

const languageCurrent = document.getElementById("languageCurrent");
const languageDropdown = document.getElementById("languageDropdown");

// ---------- Page Context ----------
const pageCategoryKey = document.body.dataset.pageCategoryKey || "";
const urlParams = new URLSearchParams(window.location.search);
const pageSubcategory = urlParams.get("sub") || "";
const pageSearch = urlParams.get("search") || "";

// ---------- State ----------
let catalogProducts = [];
let selectedCategory = "All";
let selectedSubcategory = "";
let searchTerm = pageSearch;
let currentLang = localStorage.getItem("siteLang") || "en";
let sortMode = "featured";

// ---------- UI Translations ----------
const UI_TEXT = {
  en: {
    navRings: "Rings",
    navNecklaces: "Necklaces",
    navEarrings: "Earrings",
    navBracelets: "Bracelets",
    navCollections: "Collections",
    navAbout: "About",
    navContact: "Contact",

    heroEyebrow: "Handcrafted Jewelry Catalog",
    heroTitle: "Timeless Elegance",
    heroNewArrivals: "Explore New Arrivals",
    heroBestSellers: "Explore Best Sellers",
    heroCatalog: "Explore Catalog",

    newestTitle: "Newest Arrivals",
    newestSubtitle: "Fresh additions",
    bestTitle: "Best Sellers",
    bestSubtitle: "Most loved pieces",
    catalogTitle: "Catalog",
    emptyTitle: "No products found",
    emptySubtitle: "Try another keyword or category.",
    footerText: "Elegant jewelry catalog experience with easy contact options.",
    footerContact: "Contact",

    searchPlaceholder: "Search products...",
    askPrice: "Ask for price",
    viewDetails: "View Details",
    product: "product",
    products: "products",

    modalMaterials: "Materials",
    modalStone: "Stone",
    modalSizes: "Sizes",
    modalContact: "Contact",
    modalContactText: "For availability, sizing and order details, contact us.",
    modalContactSeller: "Contact Seller",
    modalEmail: "Email",
    modalViewSellerPage: "View Seller Page",
    sortBy: "Sort by",
    sortFeatured: "Featured",
    sortNewest: "Newest",
    sortPriceLow: "Price: Low to High",
    sortPriceHigh: "Price: High to Low",
    sortAZ: "A–Z",

    viewAll: "View All",
    all: "All"
  },
  tr: {
    navRings: "Yüzükler",
    navNecklaces: "Kolyeler",
    navEarrings: "Küpeler",
    navBracelets: "Bileklikler",
    navCollections: "Setler",
    navAbout: "Hakkında",
    navContact: "İletişim",

    heroEyebrow: "El Yapımı Takı Kataloğu",
    heroTitle: "Zamansız Zarafet",
    heroNewArrivals: "Yeni Gelenleri Keşfet",
    heroBestSellers: "Çok Satanları Keşfet",
    heroCatalog: "Kataloğu Keşfet",

    newestTitle: "Yeni Gelenler",
    newestSubtitle: "En yeni eklenen ürünler",
    bestTitle: "Çok Satanlar",
    bestSubtitle: "En sevilen parçalar",
    catalogTitle: "Katalog",
    emptyTitle: "Ürün bulunamadı",
    emptySubtitle: "Başka bir kelime veya kategori deneyin.",
    footerText: "Kolay iletişim seçenekleriyle zarif bir takı kataloğu deneyimi.",
    footerContact: "İletişim",

    searchPlaceholder: "Ürün ara...",
    askPrice: "Fiyat sorunuz",
    viewDetails: "Detayları Gör",
    product: "ürün",
    products: "ürün",

    modalMaterials: "Materyaller",
    modalStone: "Taş",
    modalSizes: "Ölçüler",
    modalContact: "İletişim",
    modalContactText: "Stok, ölçü ve sipariş detayları için bizimle iletişime geçin.",
    modalContactSeller: "Satıcıyla İletişime Geç",
    modalEmail: "E-posta",
    modalViewSellerPage: "Satıcı Sayfasını Gör",
    viewAll: "Tümünü Gör",
    sortBy: "Sırala",
    sortFeatured: "Öne Çıkanlar",
    sortNewest: "En Yeni",
    sortPriceLow: "Fiyat: Artan",
    sortPriceHigh: "Fiyat: Azalan",
    sortAZ: "A–Z",

    all: "Tümü"
  }
};

// ---------- Header Subcategories ----------
const SUBCATS = {
  en: {
    rings: ["Solitaire", "Baguette", "Colored Stones", "Fantasy"],
    necklaces: ["Solitaire", "Baguette", "Colored Stones", "Fantasy"],
    earrings: ["Solitaire", "Baguette", "Colored Stones", "Fantasy"],
    bracelets: ["Solitaire", "Baguette", "Colored Stones", "Fantasy", "Tennis"],
    collections: ["Solitaire", "Baguette", "Colored Stones", "Fantasy"]
  },
  tr: {
    rings: ["Tektaş", "Baget Taşlı", "Renkli Taşlı", "Fantezi"],
    necklaces: ["Tektaş", "Baget Taşlı", "Renkli Taşlı", "Fantezi"],
    earrings: ["Tektaş", "Baget Taşlı", "Renkli Taşlı", "Fantezi"],
    bracelets: ["Tektaş", "Baget Taşlı", "Renkli Taşlı", "Fantezi", "Su Yolu"],
    collections: ["Tektaş", "Baget Taşlı", "Renkli Taşlı", "Fantezi"]
  }
};

// ---------- Helpers ----------
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

function getCategories() {
  const unique = [...new Set(catalogProducts.map((p) => p.category))];
  return [t("all"), ...unique];
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeSearchText(str) {
  return String(str || "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .trim();
}

function catKeyToDisplay(key) {
  const map = {
    en: {
      rings: "Rings",
      necklaces: "Necklaces",
      earrings: "Earrings",
      bracelets: "Bracelets",
      collections: "Collections"
    },
    tr: {
      rings: "Yüzükler",
      necklaces: "Kolyeler",
      earrings: "Küpeler",
      bracelets: "Bileklikler",
      collections: "Setler"
    }
  };
  return map[currentLang]?.[key] || map.en[key] || t("all");
}

function categoryKeyToPage(key) {
  const map = {
    rings: "rings.html",
    necklaces: "necklaces.html",
    earrings: "earrings.html",
    bracelets: "bracelets.html",
    collections: "collections.html"
  };
  return map[key] || "index.html";
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

function updateStaticTexts() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  if (searchInput) {
    searchInput.placeholder = t("searchPlaceholder");
  }

  if (languageCurrent) {
    languageCurrent.innerHTML =
      currentLang === "tr"
        ? `<span>🌐 TR</span>`
        : `<span>🌐 EN</span>`;
  }
}

function applyPageContext() {
  if (!pageCategoryKey) return;
  selectedCategory = catKeyToDisplay(pageCategoryKey);
  selectedSubcategory = pageSubcategory || "";
}

function isHomePage() {
  const path = window.location.pathname;
  return path.endsWith("/") || path.endsWith("/index.html") || path === "";
}

function parsePrice(value) {
  if (value == null || value === "") return null;

  const cleaned = String(value)
    .replace(/[^0-9.,]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(",", ".");

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function sortProducts(items) {
  const arr = [...items];

  switch (sortMode) {
    case "newest":
      return arr.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

    case "priceLow":
      return arr.sort((a, b) => {
        const pa = parsePrice(a.price);
        const pb = parsePrice(b.price);

        if (pa == null && pb == null) return 0;
        if (pa == null) return 1;
        if (pb == null) return -1;

        return pa - pb;
      });

    case "priceHigh":
      return arr.sort((a, b) => {
        const pa = parsePrice(a.price);
        const pb = parsePrice(b.price);

        if (pa == null && pb == null) return 0;
        if (pa == null) return 1;
        if (pb == null) return -1;

        return pb - pa;
      });

    case "az":
      return arr.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), currentLang)
      );

    case "featured":
    default:
      return arr.sort((a, b) => {
        const aFeatured = a.isBestSeller ? 1 : 0;
        const bFeatured = b.isBestSeller ? 1 : 0;

        if (bFeatured !== aFeatured) return bFeatured - aFeatured;

        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        return db - da;
      });
  }
}

function sanitizeWhatsappNumber(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function isMobileProductPageMode() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function getProductPageUrl(productId) {
  const params = new URLSearchParams();
  params.set("id", String(productId));
  params.set("lang", currentLang);
  return `product.html?${params.toString()}`;
}

function openProductDetails(productId) {
  if (isMobileProductPageMode()) {
    window.location.href = getProductPageUrl(productId);
    return;
  }

  openProductModal(productId);
}

// ---------- Filters ----------
function filterProducts() {
  return catalogProducts.filter((p) => {
    const matchesCategory =
      selectedCategory === t("all") || p.category === selectedCategory;

    const matchesSub =
      !selectedSubcategory ||
      slugify(p.subcategory || "") === selectedSubcategory;

    const q = normalizeSearchText(searchTerm);

    const searchableName = normalizeSearchText(p.name || "");
    const searchableCategory = normalizeSearchText(p.category || "");
    const searchableSubcategory = normalizeSearchText(p.subcategory || "");
    const searchableDescription = normalizeSearchText(p.description || "");

    const matchesSearch =
      q === "" ||
      searchableName.includes(q) ||
      searchableCategory.includes(q) ||
      searchableSubcategory.includes(q) ||
      searchableDescription.includes(q);

    return matchesCategory && matchesSub && matchesSearch;
  });
}

// ---------- Rendering ----------
function renderCategoryChips() {
  if (!categoryChips) return;

  const categories = getCategories();

  categoryChips.innerHTML = categories
    .map(
      (cat) => `
      <button class="chip ${cat === selectedCategory ? "active" : ""}" data-category="${escapeHtml(cat)}">
        ${escapeHtml(cat)}
      </button>
    `
    )
    .join("");

  categoryChips.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;
      selectedSubcategory = "";
      renderCategoryChips();
      renderProducts();
    });
  });
}

function createProductCard(product) {
  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="card-image-wrap">
        <img src="${escapeHtml(product.images?.[0] || "")}" alt="${escapeHtml(product.name)}">
      </div>

      <div class="card-body">
        <p class="card-category">${escapeHtml(product.category)}</p>
        <h3 class="card-title">${escapeHtml(product.name)}</h3>
        <p class="card-meta">${escapeHtml(shopInfo.brandName)}</p>

        <div class="card-footer">
          <span class="card-price">${escapeHtml(product.price || t("askPrice"))}</span>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  if (!productGrid || !resultCount || !emptyState) return;

  let filtered = sortProducts(filterProducts());

  if (isHomePage() && !pageCategoryKey && !pageSearch) {
    filtered = filtered.slice(0, 8);
  }

  const productWord = filtered.length === 1 ? t("product") : t("products");
  resultCount.textContent = `${filtered.length} ${productWord}`;

  if (filtered.length === 0) {
    productGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  productGrid.innerHTML = filtered.map(createProductCard).join("");

  productGrid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const productId = Number(card.dataset.productId);
      openProductDetails(productId);
    });
  });
}

function renderFeaturedSections() {
  const availableProducts = catalogProducts.filter((p) => p.status !== "sold");

  const newestProducts = [...availableProducts]
    .filter((p) => p.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const bestSellerProducts = availableProducts
    .filter((p) => p.isBestSeller === true)
    .slice(0, 4);

  if (newestGrid && newArrivalsSection) {
    if (newestProducts.length > 0) {
      newArrivalsSection.classList.remove("hidden");
      newestGrid.innerHTML = newestProducts.map(createProductCard).join("");
    } else {
      newArrivalsSection.classList.add("hidden");
      newestGrid.innerHTML = "";
    }
  }

  if (bestSellerGrid && bestSellersSection) {
    if (bestSellerProducts.length > 0) {
      bestSellersSection.classList.remove("hidden");
      bestSellerGrid.innerHTML = bestSellerProducts.map(createProductCard).join("");
    } else {
      bestSellersSection.classList.add("hidden");
      bestSellerGrid.innerHTML = "";
    }
  }

  document
    .querySelectorAll("#newestGrid .product-card, #bestSellerGrid .product-card")
    .forEach((card) => {
      card.addEventListener("click", () => {
        const productId = Number(card.dataset.productId);
        openProductDetails(productId);
      });
    });
}

// ---------- Modal ----------
function openProductModal(productId) {
  const product = catalogProducts.find((p) => p.id === productId);
  if (!product) return;

  renderModal(product, product.images?.[0] || "");

  productModal.classList.remove("hidden");
  productModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  productModal.classList.add("hidden");
  productModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modalContent.innerHTML = "";
}

function renderModal(product, activeImage) {
  modalContent.innerHTML = `
    <div class="product-detail">
      <div>
        <div class="gallery-main">
          <img src="${escapeHtml(activeImage)}" alt="${escapeHtml(product.name)}">
        </div>

        <div class="gallery-thumbs">
          ${product.images
            .map(
              (img) => `
            <button class="thumb-btn ${img === activeImage ? "active" : ""}" data-img="${escapeHtml(img)}">
              <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)} thumbnail">
            </button>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="detail-panel">
        <h2>${escapeHtml(product.name)}</h2>
        <p class="detail-category">${escapeHtml(product.category)}</p>
        <p class="detail-price">${escapeHtml(product.price || t("askPrice"))}</p>

        <p class="detail-description">${escapeHtml(product.description)}</p>

        <div class="spec-list">
          <div class="spec-item">
            <strong>${escapeHtml(t("modalMaterials"))}</strong>
            <span>${escapeHtml(product.materials?.join(", ") || "-")}</span>
          </div>
          <div class="spec-item">
            <strong>${escapeHtml(t("modalStone"))}</strong>
            <span>${escapeHtml(product.stone || "-")}</span>
          </div>
          <div class="spec-item">
            <strong>${escapeHtml(t("modalSizes"))}</strong>
            <span>${escapeHtml(product.sizes?.join(", ") || "-")}</span>
          </div>
        </div>

        <div class="seller-box">
          <h3>${escapeHtml(t("modalContact"))}</h3>
          <p><strong>${escapeHtml(shopInfo.brandName)}</strong></p>
          <p>${escapeHtml(t("modalContactText"))}</p>
          <p>${escapeHtml(shopInfo.instagram || "")}</p>

          <div class="seller-actions">
            <a class="primary" href="https://wa.me/${escapeHtml(sanitizeWhatsappNumber(shopInfo.whatsappNumber))}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("modalContactSeller"))}</a>
            <a href="mailto:${escapeHtml(shopInfo.email)}">${escapeHtml(t("modalEmail"))}</a>
            <a href="${escapeHtml(shopInfo.aboutPageUrl)}">${escapeHtml(t("modalViewSellerPage"))}</a>
          </div>
        </div>
      </div>
    </div>
  `;

  modalContent.querySelectorAll(".thumb-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      renderModal(product, btn.dataset.img);
    });
  });

  const mainImg = modalContent.querySelector(".gallery-main img");
  if (mainImg) {
    mainImg.addEventListener("click", () => {
      const startIdx = product.images.indexOf(activeImage);
      openLightbox(product.images, startIdx >= 0 ? startIdx : 0);
    });
  }
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

// ---------- API load ----------
async function loadProducts() {
  try {
    const res = await fetch(`/api/products?lang=${currentLang}`);

    let apiProducts = [];
    if (res.ok) {
      const data = await res.json();
      apiProducts = Array.isArray(data) ? data.map(normalizeApiProduct) : [];
    }

    const staticProducts = Array.isArray(products)
      ? products.map((p) => translateStaticProduct(p))
      : [];

    catalogProducts = [...staticProducts, ...apiProducts];

    applyPageContext();

    if (
      !pageCategoryKey &&
      selectedCategory !== "All" &&
      selectedCategory !== "Tümü" &&
      !catalogProducts.some((p) => p.category === selectedCategory)
    ) {
      selectedCategory = t("all");
      selectedSubcategory = "";
    }

    updateStaticTexts();
    renderHeaderDropdowns();
    renderCategoryChips();
    renderProducts();
    renderFeaturedSections();
  } catch (err) {
    console.error("Product load error:", err);

    catalogProducts = Array.isArray(products)
      ? products.map((p) => translateStaticProduct(p))
      : [];

    applyPageContext();

    updateStaticTexts();
    renderHeaderDropdowns();
    renderCategoryChips();
    renderProducts();
    renderFeaturedSections();
  }
}

// ---------- Language ----------
function bindLanguageSwitcher() {
  document.querySelectorAll("[data-lang]").forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();
      const lang = item.dataset.lang;
      if (!lang || lang === currentLang) return;

      currentLang = lang;
      localStorage.setItem("siteLang", currentLang);

      searchTerm = "";
      if (!pageCategoryKey) {
        selectedCategory = t("all");
        selectedSubcategory = "";
      }
      if (searchInput) searchInput.value = "";
      if (sortSelect) sortSelect.value = "featured";
      sortMode = "featured";

      await loadProducts();
    });
  });
}

// ---------- Events ----------
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;

    if (!isHomePage()) {
      renderProducts();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const value = e.target.value.trim();

      if (value === "") {
        window.location.href = "catalog.html";
        return;
      }

      window.location.href = `catalog.html?search=${encodeURIComponent(value)}`;
    }
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    sortMode = e.target.value;
    renderProducts();
  });
}

if (modalOverlay) modalOverlay.addEventListener("click", closeProductModal);
if (modalClose) modalClose.addEventListener("click", closeProductModal);

if (menuBtn && mobileNav) {
  menuBtn.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });
}

window.addEventListener("scroll", () => {
  if (mobileNav && mobileNav.classList.contains("open")) {
    mobileNav.classList.remove("open");
  }
}, { passive: true });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productModal && !productModal.classList.contains("hidden")) {
    closeProductModal();
  }
});

// ---------- Header dropdowns ----------
function renderHeaderDropdowns() {
  const items = document.querySelectorAll(".nav-item[data-cat]");

  items.forEach((item) => {
    const catKey = item.dataset.cat;
    const dd = item.querySelector(".nav-dropdown");
    const list = SUBCATS[currentLang]?.[catKey] || SUBCATS.en[catKey] || [];
    if (!dd) return;

    dd.innerHTML = list
      .map((name) => {
        const subSlug = slugify(name);

        if (pageCategoryKey) {
          const href = `${categoryKeyToPage(catKey)}?sub=${encodeURIComponent(subSlug)}`;
          return `<a href="${href}" data-cat="${catKey}" data-sub="${subSlug}">${escapeHtml(name)}</a>`;
        }

        return `<a href="${categoryKeyToPage(catKey)}?sub=${encodeURIComponent(subSlug)}" data-cat="${catKey}" data-sub="${subSlug}">${escapeHtml(name)}</a>`;
      })
      .join("");

    if (!pageCategoryKey) {
      dd.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          // let real pages handle it
        });
      });
    }
  });

  document.querySelectorAll(".mobile-nav-group[data-cat]").forEach((group) => {
    const catKey = group.dataset.cat;
    const mobDd = group.querySelector(".mobile-nav-subs");
    const list = SUBCATS[currentLang]?.[catKey] || SUBCATS.en[catKey] || [];
    if (!mobDd) return;

    mobDd.innerHTML = list
      .map((name) => {
        const subSlug = slugify(name);
        return `<a href="${categoryKeyToPage(catKey)}?sub=${encodeURIComponent(subSlug)}">${escapeHtml(name)}</a>`;
      })
      .join("");
  });
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".mobile-nav-arrow").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".mobile-nav-group").classList.toggle("open");
    });
  });
  updateStaticTexts();
  bindLanguageSwitcher();

  if (!pageCategoryKey) {
    selectedCategory = t("all");
  }

  if (sortSelect) {
    sortSelect.value = sortMode;
  }

  if (searchInput && searchTerm) {
    searchInput.value = searchTerm;
  }

  await loadProducts();
});