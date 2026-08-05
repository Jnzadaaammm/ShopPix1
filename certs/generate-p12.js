const fs = require("fs");
const { execSync } = require("child_process");

// Verifica se o openssl esta instalado
try {
  execSync("openssl version", { stdio: "ignore" });
} catch {
  console.error("OpenSSL nao encontrado. Instale o OpenSSL para gerar o .p12");
  console.error("Ou use um terminal com OpenSSL (Git Bash, WSL, Linux, macOS)");
  process.exit(1);
}

// Gera o arquivo .p12 a partir do certificate.pem
const password = process.argv[2] || "squarecloud";
const pemPath = "./certs/certificate.pem";
const p12Path = "./certs/certificate.p12";

try {
  execSync(
    `openssl pkcs12 -export -out ${p12Path} -in ${pemPath} -password pass:${password}`,
    { stdio: "inherit" }
  );
  console.log(`\n✅ Arquivo ${p12Path} gerado com sucesso!`);
  console.log(`🔑 Senha do .p12: ${password}`);
  console.log(`\n⚠️  NAO COMMITE ESSE ARQUIVO NO GITHUB!`);
} catch (error) {
  console.error("Erro ao gerar .p12:", error);
  process.exit(1);
}