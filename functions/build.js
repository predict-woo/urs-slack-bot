const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const srcDirectory = path.join(__dirname, "src");

// Function to get all TypeScript files from src directory
function getTsFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => path.join(dir, file));
}

// Function to build each TypeScript file
const build = async () => {
  const entryPoints = getTsFiles(srcDirectory);
  for (const entry of entryPoints) {
    const fileName = path.basename(entry);
    await esbuild
      .build({
        entryPoints: [entry],
        outfile: `dist/${fileName.replace(".ts", ".js")}`,
        bundle: true,
        minify: true,
        platform: "node",
        target: "node18", // Adjust according to your AWS Lambda Node.js version
        external: ["aws-sdk"], // Optionally exclude AWS SDK from bundling
      })
      .catch(() => process.exit(1));
  }
};

build();
