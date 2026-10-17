from pathlib import Path
import hashlib, json, zipfile, io, re
root = Path(".")
manifest = json.loads((root / "portfolio-manifest.json").read_text())
parts = manifest["parts"]
payload = b"".join((root / p["name"]).read_bytes() for p in parts)
assert hashlib.sha256(payload).hexdigest() == manifest["sha256"], "Portfolio checksum mismatch"
out = root / "_site"
out.mkdir(exist_ok=True)
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    for item in archive.infolist():
        target = (out / item.filename).resolve()
        assert target.is_relative_to(out.resolve()), "Invalid archive path"
        assert not item.filename.lower().endswith(".pdf"), "PDF publication is not permitted"
    archive.extractall(out)
assert (out / "index.html").exists()
assert len(list((out / "projects").glob("*/index.html"))) == 14
for page in out.rglob("*.html"):
    markup = page.read_text(encoding="utf-8")
    assert ".pdf" not in markup.lower()
    for ref in re.findall(r'(?:src|href)="(/[^"?#]*)', markup):
        target = out / ref.lstrip("/")
        if ref.endswith("/"):
            target = target / "index.html"
        assert target.exists(), f"Missing website file: {ref}"
print("Verified 14 projects, all local links, approved package checksum, and zero public PDFs.")
