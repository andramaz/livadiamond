const logoutBtn = document.getElementById("logoutBtn");
const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const categorySelect = document.getElementById("categorySelect");
const subcategorySelect = document.getElementById("subcategorySelect");
const priceInput = document.getElementById("price");
const statusSelect = document.getElementById("status");
const bestSellerInput = document.getElementById("bestSeller");
const stoneInput = document.getElementById("stone");
const materialsInput = document.getElementById("materials");
const imageFilesInput = document.getElementById("imageFiles");
const imagesTextarea = document.getElementById("images");
const nameEnInput = document.getElementById("nameEn");
const descEnInput = document.getElementById("descEn");
const nameTrInput = document.getElementById("nameTr");
const descTrInput = document.getElementById("descTr");
const resetBtn = document.getElementById("resetBtn");
const formError = document.getElementById("formError");
const productsTableBody = document.querySelector("#productsTable tbody");
const productSearchInput = document.getElementById("productSearch");

let categories = [];
let subcategories = [];
let products = [];
let productSearchTerm = "";

async function requireAuth() {
  const res = await fetch("/api/admin/me", {
    credentials: "include"
  });

  if (!res.ok) {
    location.href = "/admin";
    return false;
  }

  return true;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options
  });

  if (res.status === 401) {
    location.href = "/admin";
    throw new Error("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function loadCategories() {
  categories = await fetchJson("/api/admin/categories");

  categorySelect.innerHTML =
    `<option value="">Kategori seç</option>` +
    categories
      .map((c) => `<option value="${c.id}">${c.name_tr} / ${c.name_en}</option>`)
      .join("");
}

async function loadSubcategories(categoryId, selectedId = "") {
  subcategorySelect.innerHTML = `<option value="">(İsteğe bağlı)</option>`;

  if (!categoryId) {
    subcategories = [];
    return;
  }

  subcategories = await fetchJson(`/api/admin/subcategories?category_id=${categoryId}`);

  subcategorySelect.innerHTML =
    `<option value="">(İsteğe bağlı)</option>` +
    subcategories
      .map((s) => {
        const selected = String(selectedId) === String(s.id) ? "selected" : "";
        return `<option value="${s.id}" ${selected}>${s.name_tr} / ${s.name_en}</option>`;
      })
      .join("");
}

async function loadProducts() {
  products = await fetchJson("/api/admin/products");
  renderProductsTable();
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

function getFilteredProducts() {
  const q = normalizeSearchText(productSearchTerm);

  if (!q) return products;

  return products.filter((p) => {
    const idText = String(p.id || "");
    const nameEn = normalizeSearchText(p.name_en || "");
    const nameTr = normalizeSearchText(p.name_tr || "");
    const status = normalizeSearchText(p.status || "");

    return (
      idText.includes(q) ||
      nameEn.includes(q) ||
      nameTr.includes(q) ||
      status.includes(q)
    );
  });
}

function renderProductsTable() {
  const filteredProducts = getFilteredProducts();

  if (!filteredProducts.length) {
    productsTableBody.innerHTML = `
      <tr>
        <td colspan="5">${productSearchTerm ? "Eşleşen ürün bulunamadı." : "Henüz ürün yok."}</td>
      </tr>
    `;
    return;
  }

  productsTableBody.innerHTML = filteredProducts
    .map((p) => {
      return `
        <tr>
          <td>${p.id}</td>
          <td>${escapeHtml(p.name_en || "")}</td>
          <td>${escapeHtml(p.status || "")}</td>
          <td>${p.isBestSeller ? "Evet" : "Hayır"}</td>
          <td>
            <button type="button" class="btn edit-btn" data-id="${p.id}">Düzenle</button>
            <button type="button" class="btn delete-btn" data-id="${p.id}">Sil</button>
          </td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const product = products.find((p) => p.id === id);
      if (product) fillForm(product);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const ok = confirm("Bu ürünü silmek istediğine emin misin?");
      if (!ok) return;

      try {
        await fetchJson(`/api/admin/products/${id}`, {
          method: "DELETE"
        });

        if (String(productIdInput.value) === String(id)) {
          resetForm();
        }

        await loadProducts();
      } catch (err) {
        formError.textContent = err.message;
      }
    });
  });
}

function fillForm(product) {
  productIdInput.value = product.id;
  categorySelect.value = product.category_id || "";
  priceInput.value = product.price ?? "";
  statusSelect.value = product.status || "available";
  bestSellerInput.checked = Boolean(product.isBestSeller);
  stoneInput.value = product.stone || "";
  materialsInput.value = Array.isArray(product.materials) ? product.materials.join(", ") : "";
  imagesTextarea.value = Array.isArray(product.images) ? product.images.join("\n") : "";
  nameEnInput.value = product.name_en || "";
  descEnInput.value = product.description_en || "";
  nameTrInput.value = product.name_tr || "";
  descTrInput.value = product.description_tr || "";

  loadSubcategories(product.category_id, product.subcategory_id || "");
}

function resetForm() {
  productForm.reset();
  productIdInput.value = "";
  subcategorySelect.innerHTML = `<option value="">(İsteğe bağlı)</option>`;
  formError.textContent = "";
}

async function uploadSelectedImages() {
  const files = imageFilesInput.files;
  if (!files || !files.length) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (res.status === 401) {
    location.href = "/admin";
    throw new Error("Unauthorized");
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }

  return data.paths || [];
}

function getTextareaImages() {
  return imagesTextarea.value
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function getMaterialsArray() {
  return materialsInput.value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

categorySelect.addEventListener("change", async () => {
  const categoryId = categorySelect.value;
  await loadSubcategories(categoryId);
});

if (productSearchInput) {
  productSearchInput.addEventListener("input", (e) => {
    productSearchTerm = e.target.value || "";
    renderProductsTable();
  });
}

resetBtn.addEventListener("click", resetForm);

logoutBtn.addEventListener("click", async () => {
  try {
    await fetchJson("/api/admin/logout", { method: "POST" });
  } catch (err) {
    // even if logout fails, still send user away
  }
  location.href = "/admin";
});

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  try {
    const uploadedPaths = await uploadSelectedImages();
    const manualImages = getTextareaImages();
    const allImages = [...uploadedPaths, ...manualImages];

    const payload = {
      category_id: categorySelect.value,
      subcategory_id: subcategorySelect.value || null,
      price: priceInput.value,
      status: statusSelect.value,
      isBestSeller: bestSellerInput.checked,
      stone: stoneInput.value.trim(),
      materials: getMaterialsArray(),
      images: allImages,
      name_en: nameEnInput.value.trim(),
      description_en: descEnInput.value.trim(),
      name_tr: nameTrInput.value.trim(),
      description_tr: descTrInput.value.trim()
    };

    const editingId = productIdInput.value;

    if (editingId) {
      await fetchJson(`/api/admin/products/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } else {
      await fetchJson("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    }

    resetForm();
    await loadProducts();
    alert("Kaydedildi.");
  } catch (err) {
    formError.textContent = err.message;
  }
});

async function init() {
  const ok = await requireAuth();
  if (!ok) return;

  await loadCategories();
  await loadProducts();
}

init();