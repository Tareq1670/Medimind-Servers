const { execSync } = require("child_process");

const port = process.argv[2] || "5000";

try {
  const pid = execSync(
    `powershell -Command "(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess"`,
    { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
  ).trim();
  if (pid) {
    execSync(`powershell -Command "Stop-Process -Id ${pid} -Force"`, { stdio: "ignore" });
    console.log(`Killed process ${pid} on port ${port}`);
  }
} catch {
  // no process to kill
}
