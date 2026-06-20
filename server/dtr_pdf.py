import datetime as dt
import io
import json
import os
import sys

try:
    from PyPDF2 import PdfReader, PdfWriter
except ModuleNotFoundError:
    from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


def parse_date(value):
    if not value:
        return None
    return dt.date.fromisoformat(str(value)[:10])


def period_bounds(period):
    return parse_date(period.get("from")), parse_date(period.get("to"))


def period_label(period):
    start, end = period_bounds(period)
    if not start or not end:
        return ""
    if start.year == end.year and start.month == end.month:
        return f"{MONTHS[start.month - 1]} {start.day} - {end.day}, {start.year}"
    if start.year == end.year:
        return f"{MONTHS[start.month - 1]} {start.day} - {MONTHS[end.month - 1]} {end.day}, {start.year}"
    return f"{MONTHS[start.month - 1]} {start.day}, {start.year} - {MONTHS[end.month - 1]} {end.day}, {end.year}"


def parse_hour(value):
    if not value:
        return None
    parts = str(value).split(":")
    try:
        return int(parts[0])
    except (ValueError, IndexError):
        return None


def detect_shift_type(employee):
    am_in_hour = parse_hour(employee.get("scheduleAmIn"))
    pm_out_hour = parse_hour(employee.get("schedulePmOut"))
    if am_in_hour is None or pm_out_hour is None:
        return "morning"
    if (am_in_hour >= 20 or am_in_hour <= 2) and 4 <= pm_out_hour <= 8:
        return "night"
    if 5 <= am_in_hour <= 8 and 13 <= pm_out_hour <= 15:
        return "mid"
    return "morning"


def format_time(value, include_meridian=False):
    if not value:
        return ""
    parts = str(value).split(":")
    try:
        hour = int(parts[0])
        minute = int(parts[1])
    except (ValueError, IndexError):
        return ""
    display_hour = hour % 12 or 12
    if include_meridian:
        return f"{display_hour:02d}:{minute:02d}{'AM' if hour < 12 else 'PM'}"
    return f"{display_hour:02d}:{minute:02d}"


def register_fonts(template_dir):
    fonts = {
        "Calibri": "Calibri.ttf",
        "Calibri Bold": "Calibri Bold.TTF",
        "Segoe UI": "Segoe UI.ttf",
        "Segoe UI Bold": "Segoe UI Bold.ttf",
        "Times New Roman": "Times New Roman.ttf",
    }
    for font_name, file_name in fonts.items():
        font_path = os.path.join(template_dir, file_name)
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont(font_name, font_path))


def font(name):
    return name if name in pdfmetrics.getRegisteredFontNames() else "Helvetica"


def entries_for_period(entries, period):
    start, end = period_bounds(period)
    rows = {}
    if not start or not end:
        return rows
    for entry in entries:
        work_date = entry.get("workDate")
        if not work_date:
            continue
        try:
            current = parse_date(work_date)
        except ValueError:
            continue
        if start <= current <= end:
            rows[current.day] = entry
    return rows


def draw_period(c, period_index, employee, noter, period, entries, shift_type):
    left = period_index == 0
    center_x = 168.5 if left else 423
    schedule_x = 213 if left else 467.5
    employee_center_x = 178.5 if left else 433
    time_x = (78.5, 114.2, 149.9, 185.6) if left else (333, 368.7, 404.4, 440.1)

    employee_name = employee.get("name") or ""
    employee_signatory = (employee.get("signatory") or employee_name).upper()
    employee_position = employee.get("position") or ""
    regular_time = (
        f"{format_time(employee.get('scheduleAmIn'), True)} - "
        f"{format_time(employee.get('schedulePmOut'), True)}"
    )

    c.setFont(font("Segoe UI Bold"), 10)
    c.drawCentredString(center_x, 740, employee_name)

    c.setFont(font("Calibri Bold"), 9)
    c.drawCentredString(center_x, 717.5, period_label(period))

    c.setFont(font("Times New Roman"), 8)
    c.drawString(schedule_x, 704, regular_time)

    c.setFont(font("Segoe UI Bold"), 9)
    c.drawCentredString(employee_center_x, 213.5, employee_signatory)

    c.setFont(font("Times New Roman"), 9)
    c.drawCentredString(employee_center_x, 201, employee_position)

    c.setFont(font("Segoe UI Bold"), 9)
    c.drawCentredString(employee_center_x, 164, (noter.get("signatory") or "").upper())

    c.setFont(font("Times New Roman"), 9)
    c.drawCentredString(employee_center_x, 152, noter.get("position") or "")

    c.setFont(font("Calibri"), 9)
    for day, entry in entries_for_period(entries, period).items():
        y = 656.5 - ((day - 1) * 12)
        display_label = str(entry.get("displayLabel") or "").strip()
        if display_label:
            left_x = time_x[0] - 17.85
            width = (time_x[3] - time_x[0]) + 35.7
            c.setFillColorRGB(1, 1, 1)
            c.rect(left_x, y - 4.8, width, 11.8, fill=1, stroke=0)
            c.setStrokeColorRGB(0, 0, 0)
            c.rect(left_x, y - 4.8, width, 11.8, fill=0, stroke=1)
            c.setFillColorRGB(0, 0, 0)
            label_size = 8 if len(display_label) <= 34 else 6.5
            c.setFont(font("Calibri Bold"), label_size)
            c.drawCentredString(left_x + width / 2, y - 1.5, display_label)
            c.setFont(font("Calibri"), 9)
            continue
        if shift_type == "night":
            if entry.get("pmIn"):
                c.drawString(time_x[0], y, format_time(entry.get("pmIn")))
            if entry.get("amOut"):
                c.drawString(time_x[3], y, format_time(entry.get("amOut")))
        else:
            if entry.get("amIn"):
                c.drawString(time_x[0], y, format_time(entry.get("amIn")))
            if entry.get("amOut"):
                c.drawString(time_x[1], y, format_time(entry.get("amOut")))
            if entry.get("pmIn"):
                c.drawString(time_x[2], y, format_time(entry.get("pmIn")))
            if entry.get("pmOut"):
                c.drawString(time_x[3], y, format_time(entry.get("pmOut")))


def export_pdf(input_path, output_path, template_dir):
    with open(input_path, "r", encoding="utf-8-sig") as handle:
        payload = json.load(handle)

    template_path = os.path.join(template_dir, "format.pdf")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"PDF template file not found: {template_path}")

    register_fonts(template_dir)
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)

    employee = payload["employee"]
    noter = payload["noter"]
    periods = payload.get("periods", [])
    entries = payload.get("entries", [])
    shift_type = detect_shift_type(employee)

    if periods:
        draw_period(c, 0, employee, noter, periods[0], entries, shift_type)
    if len(periods) > 1:
        draw_period(c, 1, employee, noter, periods[1], entries, shift_type)

    c.save()
    packet.seek(0)

    overlay_pdf = PdfReader(packet)
    template_pdf = PdfReader(open(template_path, "rb"))
    output = PdfWriter()
    page = template_pdf.pages[0]
    page.merge_page(overlay_pdf.pages[0])
    output.add_page(page)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as output_stream:
        output.write(output_stream)


def main():
    if len(sys.argv) != 4:
        print("Usage: dtr_pdf.py <input-json> <output-pdf> <template-dir>", file=sys.stderr)
        return 2
    export_pdf(sys.argv[1], sys.argv[2], sys.argv[3])
    print(sys.argv[2])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
