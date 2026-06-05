const { execSync } = require('child_process');
try {
    console.log("Running git reset --hard origin/dev...");
    const out = execSync('git reset --hard origin/dev', { cwd: 'd:\\BTL Thực hành lập trình Web\\Sportswear-ecommerce-website' });
    console.log("Output:", out.toString());
} catch (err) {
    console.error("Error:", err.message);
    if (err.stdout) console.log("Stdout:", err.stdout.toString());
    if (err.stderr) console.log("Stderr:", err.stderr.toString());
}
