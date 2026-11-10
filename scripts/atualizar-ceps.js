const fs = require("node:fs");
const https = require("node:https");

const tipos = ["Rua", "Avenida", "Praca"];
const baseUrl = "https://viacep.com.br/ws/MG/Barbacena";

function consultarViaCep(tipo) {
  return new Promise((resolve, reject) => {
    https.get(`${baseUrl}/${tipo}/json/`, { headers: { "User-Agent": "CEP-Barbacena-UEMG/1.0" } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode !== 200) {
          reject(new Error(`ViaCEP respondeu HTTP ${response.statusCode} para ${tipo}`));
          return;
        }
        try {
          const records = JSON.parse(body);
          if (!Array.isArray(records)) throw new Error("resposta não é uma lista");
          resolve(records);
        } catch (error) {
          reject(new Error(`Resposta inválida da ViaCEP para ${tipo}: ${error.message}`));
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  const responses = await Promise.all(tipos.map(async (tipo) => {
    const records = await consultarViaCep(tipo);
    return records.map((record) => ({ ...record, tipo: tipo === "Praca" ? "Praça" : tipo }));
  }));
  const records = responses.flat().filter((record) => record.cep && record.logradouro);
  const unique = [...new Map(records.map((record) => [`${record.cep}|${record.logradouro}`, record])).values()]
    .sort((a, b) => a.logradouro.localeCompare(b.logradouro, "pt-BR"));
  fs.writeFileSync("data/ceps.json", `${JSON.stringify(unique, null, 2)}\n`);
  console.log(`Base atualizada com ${unique.length} registros da ViaCEP.`);
}

main().catch((error) => {
  console.error(`Falha ao atualizar a base: ${error.message}`);
  process.exitCode = 1;
});
