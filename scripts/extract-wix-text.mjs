import fs from "node:fs";

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

for (const file of ["wix_portfolio.html", "wix_user_stories.html"]) {
  const html = fs.readFileSync(file, "utf8");
  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  const output = file.replace(".html", ".txt");
  fs.writeFileSync(output, text);
  console.log(`${output}: ${text.length} chars`);
  console.log(text.slice(0, 1200));
}
