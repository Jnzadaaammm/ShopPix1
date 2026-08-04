const { execSync, spawn } = require("child_process");

process.env.NEXT_TELEMETRY_DISABLED = "1";
process.env.NEXT_PRIVATE_SKIP_SOURCEMAP = "1";
process.env.NODE_OPTIONS = "--max-old-space-size=3500";

console.log("[ShopPix] Instalando dependencias...");
execSync("npm install --no-audit --no-fund", { stdio: "inherit" });

console.log("[ShopPix] Preparando banco...");
execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });

console.log("[ShopPix] Fazendo build...");
execSync("npm run build", { stdio: "inherit" });

console.log("[ShopPix] Iniciando servidor...");
const server = spawn("node", [".next/standalone/server.js"], { stdio: "inherit" });

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
