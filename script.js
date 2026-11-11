const form = document.querySelector("#cep-form");
const input = document.querySelector("#cep-input");
const resultArea = document.querySelector("#result-area");
const message = document.querySelector("#cep-message");
const addressForm = document.querySelector("#address-form");
const addressInput = document.querySelector("#address-input");
const addressMessage = document.querySelector("#address-message");
const addressSuggestions = document.querySelector("#address-suggestions");
let localRecords = [];
let suggestionIndex = -1;
const localRecordsPromise = fetch("data/ceps.json").then((response) => {
  if (!response.ok) throw new Error(`Base local HTTP ${response.status}`);
  return response.json();
});
localRecordsPromise.then((records) => { localRecords = records; }).catch((error) => {
  console.error("Erro ao carregar sugestões locais:", error);
});

function digitsOnly(value) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatCep(value) {
  const digits = digitsOnly(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function setMessage(text, kind = "") {
  message.textContent = text;
  message.className = `form-message ${kind}`.trim();
}

function setAddressMessage(text, kind = "") {
  addressMessage.textContent = text;
  addressMessage.className = `form-message ${kind}`.trim();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function normalizeText(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function renderSuggestions(query) {
  const term = normalizeText(query.trim());
  addressSuggestions.innerHTML = "";
  suggestionIndex = -1;
  if (term.length < 3 || !localRecords.length) {
    addressSuggestions.classList.remove("is-visible");
    addressInput.setAttribute("aria-expanded", "false");
    return;
  }
  const matches = localRecords.filter((record) => [record.logradouro, record.bairro]
    .some((value) => normalizeText(value).includes(term))).slice(0, 8);
  if (!matches.length) {
    addressSuggestions.classList.remove("is-visible");
    addressInput.setAttribute("aria-expanded", "false");
    return;
  }
  matches.forEach((record) => {
    const item = document.createElement("li");
    item.className = "address-suggestion";
    item.setAttribute("role", "option");
    item.dataset.cep = record.cep;
    item.innerHTML = `<strong>${escapeHtml(record.logradouro)}</strong><span>${escapeHtml(record.bairro || "Bairro não informado")} · ${escapeHtml(record.cep)}</span>`;
    item.addEventListener("click", () => selectSuggestion(record));
    addressSuggestions.appendChild(item);
  });
  addressSuggestions.classList.add("is-visible");
  addressInput.setAttribute("aria-expanded", "true");
}

function selectSuggestion(record) {
  addressInput.value = record.logradouro;
  addressSuggestions.classList.remove("is-visible");
  addressInput.setAttribute("aria-expanded", "false");
  setAddressMessage("");
  addressForm.requestSubmit();
}

function showLoading() {
  resultArea.innerHTML = '<div class="loading" role="status">Consultando a ViaCEP...</div>';
}

function showResult(address) {
  const warning = address.localidade.toLowerCase() !== "barbacena" || address.uf !== "MG"
    ? `<p class="city-warning">Este CEP pertence a ${address.localidade} · ${address.uf}, não a Barbacena.</p>`
    : "";
  resultArea.innerHTML = `
    <article class="address-card">
      <div class="address-fields">
        <div class="address-field"><small>Logradouro</small><strong>${escapeHtml(address.logradouro || "Não informado")}</strong></div>
        <div class="address-field"><small>Bairro</small><strong>${escapeHtml(address.bairro || "Não informado")}</strong></div>
        <div class="address-field"><small>Cidade</small><strong>${escapeHtml(address.localidade)}</strong></div>
        <div class="address-field"><small>UF</small><strong>${escapeHtml(address.uf)}</strong></div>
        ${warning}
      </div>
      <div class="card-stamp" aria-label="Localidade ${escapeHtml(address.localidade)}, ${escapeHtml(address.uf)}"><strong>${escapeHtml(address.uf)}</strong>${escapeHtml(address.localidade.toUpperCase())}<br>ENDEREÇO</div>
    </article>`;
}

async function fetchCep(cep) {
  // A consulta principal usa a API oficial em tempo real.
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) throw new Error(`ViaCEP HTTP ${response.status}`);
  const address = await response.json();
  return address.erro ? null : address;
}

async function fetchAddresses(query) {
  const encodedQuery = encodeURIComponent(query.trim());
  const response = await fetch(`https://viacep.com.br/ws/MG/Barbacena/${encodedQuery}/json/`);
  if (!response.ok) throw new Error(`ViaCEP HTTP ${response.status}`);
  const addresses = await response.json();
  const apiAddresses = Array.isArray(addresses) ? addresses.filter((address) => !address.erro) : [];
  if (apiAddresses.length) return apiAddresses;

  // A ViaCEP não oferece busca por bairro em todos os casos; nesse cenário,
  // consultamos a base local consolidada, também originada da ViaCEP.
  const term = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const localRecords = await localRecordsPromise;
  return localRecords.filter((address) => [address.logradouro, address.bairro]
    .some((value) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(term)));
}

function showAddressResults(addresses) {
  if (!addresses.length) {
    resultArea.innerHTML = '<div class="empty-result"><p>Nenhum endereço encontrado.</p><span>Confira o nome e tente uma nova busca.</span></div>';
    setAddressMessage("Não encontramos esse logradouro em Barbacena.", "error");
    return;
  }
  resultArea.innerHTML = `<div class="address-results"><p class="result-count">${addresses.length} endereço(s) encontrado(s) pela ViaCEP.</p>${addresses.slice(0, 10).map((address) => `
    <article class="address-option">
      <strong>${escapeHtml(address.logradouro || "Logradouro não informado")}</strong>
      <span>${escapeHtml(address.bairro || "Bairro não informado")} · ${escapeHtml(address.localidade)} · ${escapeHtml(address.uf)} · ${formatCep(address.cep)}</span>
      <button type="button" data-cep="${escapeHtml(address.cep)}">Ver endereço completo →</button>
    </article>`).join("")}</div>`;
  resultArea.querySelectorAll("[data-cep]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = formatCep(button.dataset.cep);
      form.requestSubmit();
      window.location.hash = "consulta";
    });
  });
  setAddressMessage("Busca concluída.", "success");
}

input.addEventListener("input", () => {
  input.value = formatCep(input.value);
  const length = digitsOnly(input.value).length;
  setMessage(length > 0 && length < 8 ? "Continue digitando: o CEP precisa de 8 números." : "");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cep = digitsOnly(input.value);
  if (cep.length !== 8) {
    setMessage("Digite um CEP completo no formato 00000-000.", "error");
    input.focus();
    return;
  }
  showLoading();
  setMessage("");
  try {
    const address = await fetchCep(cep);
    if (!address) {
      resultArea.innerHTML = '<div class="empty-result"><p>Não encontramos este CEP.</p><span>Confira os números e tente novamente.</span></div>';
      setMessage("Não encontramos este CEP. Confira os números e tente novamente.", "error");
      return;
    }
    showResult(address);
    setMessage("Endereço localizado.", "success");
  } catch (error) {
    resultArea.innerHTML = '<div class="empty-result"><p>Não foi possível concluir a consulta.</p><span>Verifique sua conexão e tente novamente.</span></div>';
    setMessage("A ViaCEP está temporariamente indisponível.", "error");
    console.error("Erro na consulta de CEP:", error);
  }
});

addressInput.addEventListener("input", () => {
  renderSuggestions(addressInput.value);
  setAddressMessage(addressInput.value.trim().length > 0 && addressInput.value.trim().length < 3
    ? "Digite pelo menos 3 letras para pesquisar."
    : "");
});

addressInput.addEventListener("keydown", (event) => {
  const items = [...addressSuggestions.querySelectorAll(".address-suggestion")];
  if (!addressSuggestions.classList.contains("is-visible") || !items.length) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    suggestionIndex = (suggestionIndex + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
    items.forEach((item, index) => item.setAttribute("aria-selected", String(index === suggestionIndex)));
  }
  if (event.key === "Enter" && suggestionIndex >= 0) {
    event.preventDefault();
    const record = localRecords.find((item) => item.cep === items[suggestionIndex].dataset.cep);
    if (record) selectSuggestion(record);
  }
  if (event.key === "Escape") addressSuggestions.classList.remove("is-visible");
});

addressForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  addressSuggestions.classList.remove("is-visible");
  const query = addressInput.value.trim();
  if (query.length < 3) {
    setAddressMessage("Digite pelo menos 3 letras do logradouro ou bairro.", "error");
    addressInput.focus();
    return;
  }
  resultArea.innerHTML = '<div class="loading" role="status">Procurando endereços...</div>';
  setAddressMessage("");
  try {
    showAddressResults(await fetchAddresses(query));
  } catch (error) {
    resultArea.innerHTML = '<div class="empty-result"><p>Não foi possível concluir a busca.</p><span>Verifique sua conexão e tente novamente.</span></div>';
    setAddressMessage("A ViaCEP está temporariamente indisponível.", "error");
    console.error("Erro na busca de logradouro:", error);
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".address-form")) {
    addressSuggestions.classList.remove("is-visible");
    addressInput.setAttribute("aria-expanded", "false");
  }
});

// Reveals the lower sections only as they enter the viewport.
const revealTargets = document.querySelectorAll(".result-section, .steps-section, .about-section");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((target) => {
    target.classList.add("reveal-target");
    revealObserver.observe(target);
  });
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}
