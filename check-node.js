/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");

// Platform-aware NVM detection
function isNvmInstalled() {
  try {
    if (os.platform() === 'win32') {
      execSync("nvm version", { stdio: "ignore" });
    } else {
      execSync("command -v nvm", { stdio: "ignore" });
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Platform-specific NVM installation
function installNvm() {
  console.log("🚨 NVM is not installed.");
  
  if (os.platform() === 'win32') {
    console.log(`
    ⚠️ Windows Detected - Please install nvm-windows manually:
    1. Download from: https://github.com/coreybutler/nvm-windows/releases
    2. Run the installer as Administrator
    3. Close and reopen all terminal windows
    4. Run this script again
    `);
  } else {
    console.log("📥 Installing NVM using official script...");
    try {
      execSync("curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash", { stdio: "inherit" });
      console.log("✅ NVM installed. Please restart your terminal and run this script again.");
    } catch (err) {
      console.error("❌ Failed to install NVM. Manual installation required: https://nvm.sh");
    }
  }
  process.exit(1);
}

// Node.js version management
function manageNodeVersion(requiredVersion) {
  try {
    const activeVersion = execSync("node -v", { encoding: "utf8" }).trim();
    
    if (activeVersion === `v${requiredVersion}`) {
      console.log(`✅ Using Node.js ${activeVersion}`);
      return;
    }

    console.log(`🔄 Current: ${activeVersion}, Required: v${requiredVersion}`);
    
    try {
      execSync(`nvm install ${requiredVersion}`, { stdio: "inherit" });
      execSync(`nvm use ${requiredVersion}`, { stdio: "inherit" });
    } catch (error) {
      console.error(`❌ Failed to install Node.js ${requiredVersion}`);
      console.log("Common solutions:");
      console.log("- Restart your terminal session");
      if (os.platform() === 'win32') console.log("- Run as Administrator");
      console.log("- Check network connection");
      process.exit(1);
    }
  } catch (error) {
    console.log("📥 Installing Node.js for the first time...");
    execSync(`nvm install ${requiredVersion}`, { stdio: "inherit" });
  }
}

// Next.js setup
function setupNextJS() {
  try {
    execSync("npx next --version", { stdio: "ignore" });
    console.log("✅ Next.js is installed");
  } catch (err) {
    console.log("📥 Installing Next.js...");
    execSync("npm install next", { stdio: "inherit" });
  }
}

// Main workflow
function main() {
  // Verify .nvmrc exists
  if (!fs.existsSync(".nvmrc")) {
    console.error("❌ Missing .nvmrc file");
    process.exit(1);
  }

  const requiredVersion = fs.readFileSync(".nvmrc", "utf8").trim();

  // NVM verification
  if (!isNvmInstalled()) {
    installNvm();
  }

  // Node version setup
  manageNodeVersion(requiredVersion);

  // Dependency management
  try {
    console.log("🔧 Installing dependencies...");
    execSync("npm install", { stdio: "inherit" });

  } catch (error) {
    console.error("❌ Dependency error:", error.message);
    process.exit(1);
  }

  // Start Next.js
  console.log("🚀 Starting development server...");
  execSync("npm run dev", { stdio: "inherit" });
}

// Run the main workflow
try {
  main();
} catch (error) {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
}