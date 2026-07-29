import io
import os
import sys
import tempfile

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas


def create_watermark_page(width, height, label):
    buffer = io.BytesIO()
    overlay = canvas.Canvas(buffer, pagesize=(width, height))
    overlay.saveState()
    overlay.setFillColorRGB(0.45, 0.45, 0.45)
    overlay.setFillAlpha(0.16)
    overlay.setFont("Helvetica-Bold", min(width, height) * 0.13)
    overlay.translate(width / 2, height / 2)
    overlay.rotate(45)
    overlay.drawCentredString(0, 0, label)
    overlay.restoreState()
    overlay.save()
    buffer.seek(0)
    return PdfReader(buffer).pages[0]


def add_watermark_in_place(pdf_path, label="PREVIEW"):
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        page.merge_page(create_watermark_page(width, height, label), over=True)
        writer.add_page(page)

    output_dir = os.path.dirname(os.path.abspath(pdf_path))
    handle, temporary_path = tempfile.mkstemp(
        prefix="leave-preview-watermark-",
        suffix=".pdf",
        dir=output_dir,
    )
    os.close(handle)
    try:
        with open(temporary_path, "wb") as output:
            writer.write(output)
        os.replace(temporary_path, pdf_path)
    finally:
        if os.path.exists(temporary_path):
            os.remove(temporary_path)


def main():
    if len(sys.argv) not in {2, 3}:
        print("Usage: pdf_watermark.py <input-pdf> [label]", file=sys.stderr)
        return 2
    add_watermark_in_place(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else "PREVIEW")
    print(sys.argv[1])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
