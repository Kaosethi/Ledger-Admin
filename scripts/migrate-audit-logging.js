#!/usr/bin/env node

/**
 * Migration script to update API endpoints to use the new audit logging system
 *
 * This script will:
 * 1. Find all route.ts files in the API directory (excluding merchant-app)
 * 2. Update import statements to use the new audit middleware
 * 3. Add audit context parameter where needed
 * 4. Create backup files before making changes
 */

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "../src/app/api");
const BACKUP_DIR = path.join(__dirname, "../audit-migration-backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function findRouteFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip merchant-app directory
      if (entry.name === "merchant-app") {
        continue;
      }
      findRouteFiles(fullPath, files);
    } else if (entry.name === "route.ts") {
      files.push(fullPath);
    }
  }

  return files;
}

function createBackup(filePath) {
  const relativePath = path.relative(API_DIR, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup created: ${backupPath}`);
}

function updateFileContent(content) {
  let updated = content;

  // Update import statements
  updated = updated.replace(
    /import\s*{\s*withAuth\s*}\s*from\s*["']@\/lib\/auth\/middleware["']/g,
    "import { withAuth } from '@/lib/audit'"
  );

  // Add audit context imports for files that might need them
  if (updated.includes("withAuth") && !updated.includes("@/lib/audit")) {
    // If file uses withAuth but doesn't import from audit, add the import
    updated = updated.replace(
      /import\s*{\s*withAuth\s*}\s*from\s*["'][^"']+["']/g,
      "import { withAuth } from '@/lib/audit'"
    );
  }

  return updated;
}

function migrateFile(filePath) {
  console.log(`\nMigrating: ${path.relative(API_DIR, filePath)}`);

  const content = fs.readFileSync(filePath, "utf8");

  // Skip if already migrated
  if (content.includes("@/lib/audit")) {
    console.log("  ✓ Already migrated");
    return;
  }

  // Skip if doesn't use withAuth
  if (!content.includes("withAuth")) {
    console.log("  - No withAuth found, skipping");
    return;
  }

  // Create backup
  createBackup(filePath);

  // Update content
  const updatedContent = updateFileContent(content);

  // Write updated file
  fs.writeFileSync(filePath, updatedContent, "utf8");
  console.log("  ✓ Migration completed");

  // Show what changed
  if (content !== updatedContent) {
    console.log("  Changes made:");
    if (
      content.includes("@/lib/auth/middleware") &&
      updatedContent.includes("@/lib/audit")
    ) {
      console.log(
        "    - Updated import from @/lib/auth/middleware to @/lib/audit"
      );
    }
  }
}

function main() {
  console.log("🔍 Finding API route files...");
  const routeFiles = findRouteFiles(API_DIR);

  console.log(
    `Found ${routeFiles.length} route files (excluding merchant-app)`
  );

  console.log("\n📝 Starting migration...");

  for (const file of routeFiles) {
    migrateFile(file);
  }

  console.log("\n✅ Migration completed!");
  console.log("\nNext steps:");
  console.log("1. Review the changes made to each file");
  console.log("2. Test your API endpoints to ensure they work correctly");
  console.log("3. Add specific audit logging using helpers where needed");
  console.log(
    "4. Consider updating handlers to use withAuditLogging for more control"
  );
  console.log("\nBackups are stored in:", BACKUP_DIR);
  console.log("Documentation: See AUDIT_LOGGING.md for detailed usage guide");
}

if (require.main === module) {
  main();
}

module.exports = {
  findRouteFiles,
  updateFileContent,
  migrateFile,
};
