import calendar
import datetime as dt
import json
import os
import sys

import openpyxl


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


def cut_range(year, month, cut):
    last_day = calendar.monthrange(year, month)[1]
    if cut == "first":
        return 1, 15
    if cut == "last":
        return 16, last_day
    return 1, last_day


def date_range_label(year, month, cut):
    start, end = cut_range(year, month, cut)
    return f"{start} - {end}"


def parse_date(value):
    if not value:
        return None
    return dt.date.fromisoformat(str(value)[:10])


def period_bounds(period):
    start = parse_date(period.get("from") or period.get("startDate") or period.get("dateFrom"))
    end = parse_date(period.get("to") or period.get("endDate") or period.get("dateTo"))
    if start and end:
        return start, end
    year = int(period["year"])
    month = int(period["month"])
    first_day, last_day = cut_range(year, month, period.get("cut") or "full")
    return dt.date(year, month, first_day), dt.date(year, month, last_day)


def period_label(period):
    start, end = period_bounds(period)
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
    except ValueError:
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


def period_rows(entries, period):
    start, end = period_bounds(period)
    rows = {}
    for entry in entries:
        work_date = entry.get("workDate")
        if not work_date:
            continue
        try:
            current = dt.date.fromisoformat(work_date[:10])
        except ValueError:
            continue
        if start <= current <= end:
            rows[current.day] = entry
    return rows


def fill_period(sheet, start_col, employee, noter, period, entries, shift_type):
    left = start_col == "A"
    name_cell = "A4" if left else "I4"
    period_cell = "A6" if left else "I6"
    schedule_cell = "F7" if left else "N7"
    employee_signatory_cell = "C48" if left else "K48"
    employee_position_cell = "C49" if left else "K49"
    noter_signatory_cell = "C52" if left else "K52"
    noter_position_cell = "C53" if left else "K53"
    time_cols = ("B", "C", "D", "E") if left else ("J", "K", "L", "M")

    employee_name = employee.get("name") or ""
    employee_signatory = employee.get("signatory") or employee_name
    employee_position = employee.get("position") or ""
    regular_time = (
        f"{format_time(employee.get('scheduleAmIn'), True)} - "
        f"{format_time(employee.get('schedulePmOut'), True)}"
    )

    sheet[name_cell] = employee_name
    sheet[period_cell] = period_label(period)
    sheet[schedule_cell] = regular_time
    sheet[employee_signatory_cell] = employee_signatory.upper()
    sheet[employee_position_cell] = employee_position
    sheet[noter_signatory_cell] = (noter.get("signatory") or "").upper()
    sheet[noter_position_cell] = noter.get("position") or ""

    rows = period_rows(entries, period)
    for day, entry in rows.items():
        row = day + 10
        if shift_type == "night":
            sheet[f"{time_cols[0]}{row}"] = format_time(entry.get("pmIn"))
            sheet[f"{time_cols[1]}{row}"] = ""
            sheet[f"{time_cols[2]}{row}"] = ""
            sheet[f"{time_cols[3]}{row}"] = format_time(entry.get("amOut"))
        else:
            sheet[f"{time_cols[0]}{row}"] = format_time(entry.get("amIn"))
            sheet[f"{time_cols[1]}{row}"] = format_time(entry.get("amOut"))
            sheet[f"{time_cols[2]}{row}"] = format_time(entry.get("pmIn"))
            sheet[f"{time_cols[3]}{row}"] = format_time(entry.get("pmOut"))


def export_excel(input_path, output_path, template_path):
    with open(input_path, "r", encoding="utf-8-sig") as handle:
        payload = json.load(handle)

    workbook = openpyxl.load_workbook(template_path)
    sheet = workbook.active
    employee = payload["employee"]
    noter = payload["noter"]
    entries = payload.get("entries", [])
    periods = payload.get("periods", [])
    shift_type = detect_shift_type(employee)

    if periods:
        fill_period(sheet, "A", employee, noter, periods[0], entries, shift_type)
    if len(periods) > 1:
        fill_period(sheet, "I", employee, noter, periods[1], entries, shift_type)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    workbook.save(output_path)


def main():
    if len(sys.argv) != 4:
        print("Usage: dtr_excel.py <input-json> <output-xlsx> <template-xlsx>", file=sys.stderr)
        return 2
    export_excel(sys.argv[1], sys.argv[2], sys.argv[3])
    print(sys.argv[2])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
