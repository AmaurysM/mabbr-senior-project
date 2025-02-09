const { execSync } = require("child_process");
const fs = require("fs");

// Check if nvm is installed
function isNvmInstalled() {
  try {
    execSync("command -v nvm", { stdio: "ignore" });
    return true;
  } catch (err) {
    return false;
  }
}

// Install nvm via npm if not installed
function installNvm() {
  console.log("🚨 NVM is not installed. Installing NVM using npm...");
  try {
    execSync("npm install -g nvm", { stdio: "inherit" });
    console.log("✅ NVM installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install NVM using npm.");
    process.exit(1);
  }
}

// Install Node.js if not installed
function installNode(requiredVersion) {
  console.log(`🚨 Node.js is not installed or the required version (${requiredVersion}) is missing.`);
  console.log(`📥 Installing Node.js ${requiredVersion}...`);
  try {
    execSync(`nvm install ${requiredVersion}`, { stdio: "inherit" });
    execSync(`nvm use ${requiredVersion}`, { stdio: "inherit" });
    console.log(`✅ Node.js ${requiredVersion} is now active.`);
  } catch (installError) {
    console.error("❌ Failed to install Node.js. Make sure NVM is installed and available.");
    process.exit(1);
  }
}

// Check if Next.js is installed
function isNextInstalled() {
  try {
    execSync("npx next --version", { stdio: "ignore" });
    return true;
  } catch (err) {
    return false;
  }
}

// Install Next.js if not installed
function installNext() {
  console.log("🚨 Next.js is not installed. Installing Next.js...");
  try {
    execSync("npm install next", { stdio: "inherit" });
    console.log("✅ Next.js installed successfully.");
  } catch (err) {
    console.error("❌ Failed to install Next.js.");
    process.exit(1);
  }
}

// Check if .nvmrc exists and read the required version
const requiredVersion = fs.existsSync(".nvmrc") ? fs.readFileSync(".nvmrc", "utf8").trim() : null;

if (!requiredVersion) {
  console.error("⚠️  No .nvmrc file found! Please create one with the required Node.js version.");
  process.exit(1);
}

// Ensure Node.js is installed
try {
  const activeVersion = execSync("node -v", { encoding: "utf8" }).trim();

  if (activeVersion === `v${requiredVersion}`) {
    console.log(`✅ Node.js is already set to the required version: ${activeVersion}`);
  } else {
    console.log(`🔄 The current Node.js version is ${activeVersion}, switching to v${requiredVersion}...`);

    if (!isNvmInstalled()) {
      console.log("⚠️ NVM is not installed. Installing NVM using npm...");
      installNvm();
    }

    execSync(`nvm use ${requiredVersion}`, { stdio: "inherit" });
    console.log(`✅ Node.js version switched to ${requiredVersion}`);
  }
} catch (error) {
  installNode(requiredVersion);
}

// Ensure Next.js is installed
if (!isNextInstalled()) {
  installNext();
} else {
  console.log("✅ Next.js is already installed.");
  console.log("🔧 Installing dependencies...");
  execSync('npm install', { stdio: 'inherit' });
  console.log("🚀 Starting the development server...");
  execSync('npm run dev', { stdio: 'inherit' });
}

// Lets try to install dependencies and start the development server
try {
  console.log("🔧 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });
  console.log("🚀 Starting the development server...");
  execSync("npm run dev", { stdio: "inherit" });

} catch (error) {
  console.error("❌ Failed to start the development server.");
  process.exit(1);
}