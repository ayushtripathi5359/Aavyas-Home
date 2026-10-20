// One-off: converts supplied originals (PNG/HEIC) in source-photos to optimized web JPEGs in public/photos.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";


const src = "source-photos", out = "public/photos";
for (const f of fs.readdirSync(src)) {
  const ext = path.extname(f).toLowerCase();
  if (![".png", ".heic"].includes(ext)) continue;
  let input = fs.readFileSync(path.join(src, f));
  
  const name = path.basename(f, path.extname(f)).toLowerCase() + ".jpg";
  const info = await sharp(input).rotate().resize({ width: 1800, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, name));
  console.log(name, info.width + "x" + info.height, Math.round(info.size / 1024) + "KB");
}
