import { ensureCatalog } from "../server/agarasDb";

await ensureCatalog();
console.log("AAGRA expanded catalog seed complete");
