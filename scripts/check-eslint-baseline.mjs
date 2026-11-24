import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const executable = resolve("node_modules", ".bin", process.platform === "win32" ? "eslint.cmd" : "eslint");
const result = spawnSync(executable, [".", "--format", "json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
});

if (result.error) throw result.error;

let report;
try {
    report = JSON.parse(result.stdout);
} catch {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(1);
}

const baseline = JSON.parse(readFileSync(resolve("eslint-baseline.json"), "utf8"));
const counts = {};
let errors = 0;

for (const file of report) {
    errors += file.errorCount;
    for (const message of file.messages) {
        const rule = message.ruleId || "unclassified";
        counts[rule] = (counts[rule] || 0) + 1;
    }
}

const regressions = Object.entries(counts)
    .filter(([rule, count]) => count > (baseline[rule] || 0))
    .map(([rule, count]) => `${rule}: ${count} (baseline ${baseline[rule] || 0})`);

if (errors > 0 || regressions.length > 0) {
    if (errors > 0) console.error(`ESLint encontrou ${errors} erro(s).`);
    if (regressions.length > 0) console.error(`Novos avisos acima da baseline:\n${regressions.join("\n")}`);
    process.exit(1);
}

const warnings = report.reduce((total, file) => total + file.warningCount, 0);
console.log(`ESLint aprovado: 0 erros, ${warnings} avisos legados (baseline máxima: ${Object.values(baseline).reduce((a, b) => a + b, 0)}).`);
