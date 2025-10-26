import fs from "fs";
import path from "path";

const DEFAULT_MODULES_JSON = process.cwd()+ "/data/modules.json"
const modulesJsonPath = process.env.MODULES_JSON_PATH || DEFAULT_MODULES_JSON;

/** Lee el archivo modules.json y devuelve el objeto con todos los módulos */
export function readRegistrySync() {
  try {
    const raw = fs.readFileSync(modulesJsonPath, "utf8");
    const json = JSON.parse(raw);
    if (json && typeof json === "object") return json;
  } catch (err) {
    console.error("[readRegistrySync] No se pudo leer modules.json:", err.message);
  }
  return {};
}

/** Devuelve true si el slug existe actualmente en el registry */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== "string") return false;
  const registry = readRegistrySync();
  return Object.prototype.hasOwnProperty.call(registry, slug);
}

/** Convierte el objeto de modules.json en un array */
export function getModulesArray() {
  const registry = readRegistrySync();
  return Object.values(registry).map((mod) => ({
    slug: mod.slug,
    name: mod.name ?? mod.slug,
    custom_name: mod.customName || mod.name || mod.slug,
    description: mod.description || "",
    language: mod.language,
    status: mod.status,
    dir: mod.dir,
    port: mod.port,
    pid: mod.pid,
    createdAt: mod.createdAt,
  }));
}
