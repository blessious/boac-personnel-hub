import os
import sys

try:
    from PyPDF2 import PdfReader, PdfWriter
except ModuleNotFoundError:
    from pypdf import PdfReader, PdfWriter


def merge_pdfs(output_path, input_paths):
    writer = PdfWriter()
    for input_path in input_paths:
        if not os.path.exists(input_path):
            continue
        reader = PdfReader(input_path)
        for page in reader.pages:
            writer.add_page(page)
    if len(writer.pages) == 0:
        raise RuntimeError("No PDF pages were generated")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as handle:
        writer.write(handle)


def main():
    if len(sys.argv) < 3:
        print("Usage: merge_pdfs.py <output-pdf> <input-pdf>...", file=sys.stderr)
        return 2
    merge_pdfs(sys.argv[1], sys.argv[2:])
    print(sys.argv[1])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
