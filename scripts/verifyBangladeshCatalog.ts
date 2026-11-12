import { verifyBangladeshCatalog } from "../shared/bangladeshCatalog";

const result = verifyBangladeshCatalog();
if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}
console.log(`Bangladesh catalog valid: ${result.controlCount} controls, ${result.sourceCount} sources`);
