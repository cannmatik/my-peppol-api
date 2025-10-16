import { buildNeonDatabase } from './build-database.js';

console.log("🚀 Starting simple build...");

try {
  await buildNeonDatabase();
  console.log("🎉 Build completed successfully!");
} catch (error) {
  console.error("💥 Build failed:", error);
  process.exit(1);
}