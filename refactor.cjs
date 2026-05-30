const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace route handler signatures to include next
  // Covers: (req, res) =>, (req: any, res) =>, (req: any, res: any) =>
  content = content.replace(/\(req(?:\s*:\s*any)?\s*,\s*res(?:\s*:\s*any)?\)\s*=>/g, '(req: any, res, next) =>');

  // Replace res.status(500).json({ error: e.message }) with next(e)
  content = content.replace(/res\.status\(500\)\.json\(\{\s*error\s*:\s*e\.message\s*\}\)/g, 'next(e)');

  // Replace res.status(500).json({ error: e }) with next(e)
  content = content.replace(/res\.status\(500\)\.json\(\{\s*error\s*:\s*e\s*\}\)/g, 'next(e)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${file}`);
}
