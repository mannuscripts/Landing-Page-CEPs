const form = document.querySelector("#cep-form");
const input = document.querySelector("#cep-input");
const resultArea = document.querySelector("#result-area");
const message = document.querySelector("#cep-message");

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
        <div class="address-field"><small>Logradouro</small><strong>${address.logradouro || "Não informado"}</strong></div>
        <div class="address-field"><small>Bairro</small><strong>${address.bairro || "Não informado"}</strong></div>
        <div class="address-field"><small>Cidade</small><strong>${address.localidade}</strong></div>
        <div class="address-field"><small>UF</small><strong>${address.uf}</strong></div>
        ${warning}
      </div>
      <div class="card-stamp" aria-label="Localidade ${address.localidade}, ${address.uf}"><strong>${address.uf}</strong>${address.localidade.toUpperCase()}<br>ENDEREÇO</div>
    </article>`;
}

async function fetchCep(cep) {
  // A consulta principal usa a API oficial em tempo real.
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) throw new Error(`ViaCEP HTTP ${response.status}`);
  const address = await response.json();
  return address.erro ? null : address;
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
