import json
import os
import re
import shutil
import sys
import tempfile
import zipfile
from copy import copy
from datetime import datetime

from openpyxl import load_workbook
from openpyxl.cell.cell import MergedCell


def text(value):
    if value is None:
        return ""
    return str(value).strip()


def pds_text(value):
    value = text(value)
    return value if value else "N/A"


def first(*values):
    for value in values:
        value = text(value)
        if value:
            return value
    return ""


def date_text(value):
    value = text(value)
    if not value:
        return "N/A"
    if value.lower() in {"n/a", "na", "present", "current"}:
        return "N/A" if value.lower() in {"n/a", "na"} else "Present"
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).strftime("%m/%d/%Y")
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(value, fmt).strftime("%m/%d/%Y")
        except ValueError:
            pass
    return value


def number_text(value):
    value = text(value)
    if not value:
        return "N/A"
    try:
        number = float(value)
    except ValueError:
        return value
    if number.is_integer():
        return str(int(number))
    return f"{number:.3f}".rstrip("0").rstrip(".")


def full_name(payload, order="first_middle_last"):
    if order == "first_last":
        parts = [payload.get("firstname"), payload.get("lastname")]
    else:
        parts = [payload.get("firstname"), payload.get("middlename"), payload.get("lastname")]
    name = " ".join(text(part) for part in parts if text(part))
    ext = text(payload.get("nameExt"))
    return f"{name} {ext}".strip() if ext else name


def section_payloads(sections, key):
    return [row.get("payload", {}) for row in sections.get(key, []) if isinstance(row, dict)]


def single_payload(sections, key):
    rows = section_payloads(sections, key)
    return rows[0] if rows else {}


def split_name(payload):
    return full_name(payload, "first_last")


def get_any(payload, *keys):
    for key in keys:
        value = payload.get(key)
        if text(value):
            return value
    return ""


def set_cell(sheet, ref, value):
    value = pds_text(value)
    cell = sheet[ref]
    cell.value = value
    alignment = copy(cell.alignment)
    alignment.wrap_text = True
    alignment.shrink_to_fit = True
    cell.alignment = alignment


def clear_cells(sheet, refs):
    for ref in refs:
        if isinstance(sheet[ref], MergedCell):
            continue
        sheet[ref].value = None


def initialize_na(sheet, refs):
    for ref in refs:
        set_cell(sheet, ref, "N/A")


def row_refs(columns, start_row, max_rows):
    return [f"{col}{row}" for row in range(start_row, start_row + max_rows) for col in columns]


def mark_cell(sheet, ref):
    cell = sheet[ref]
    cell.value = "X"
    alignment = copy(cell.alignment)
    alignment.horizontal = "center"
    alignment.vertical = "center"
    cell.alignment = alignment


def normalize_gov_service(value):
    value = text(value).lower()
    if value in {"yes", "y", "true", "1", "government", "gov", "public"}:
        return "YES"
    if value in {"no", "n", "false", "0", "private"}:
        return "NO"
    return "N/A"


def sort_current_first(rows):
    def key(item):
        date_to = text(item.get("dateTo") or item.get("yearTo") or item.get("to")).lower()
        if date_to in {"present", "current"}:
            return "9999-99-99"
        return text(item.get("dateTo") or item.get("yearTo") or item.get("to") or "")

    return sorted(rows, key=key, reverse=True)


def fill_education(sheet, rows):
    initialize_na(sheet, row_refs(["D", "G", "J", "K", "L", "M", "N"], 54, 5))
    row_by_level = {
        "elementary": 54,
        "secondary": 55,
        "vocational": 56,
        "college": 57,
        "graduate studies": 58,
        "graduate": 58,
    }
    for item in rows:
        target = row_by_level.get(text(item.get("level")).lower())
        if not target:
            continue
        set_cell(sheet, f"D{target}", item.get("school"))
        set_cell(sheet, f"G{target}", item.get("degree"))
        set_cell(sheet, f"J{target}", item.get("yearFrom"))
        set_cell(sheet, f"K{target}", item.get("yearTo"))
        set_cell(sheet, f"L{target}", first(item.get("highest"), item.get("units")))
        set_cell(sheet, f"M{target}", item.get("yearGraduated"))
        set_cell(sheet, f"N{target}", item.get("scholarship"))


def fill_rows(sheet, rows, start_row, max_rows, mapping):
    initialize_na(sheet, row_refs([col for col, _key in mapping], start_row, max_rows))
    for index, item in enumerate(rows[:max_rows]):
        row = start_row + index
        for col, key in mapping:
            value = key(item) if callable(key) else item.get(key)
            set_cell(sheet, f"{col}{row}", value)


def fill_sheet(payload, output_path, template_path):
    wb = load_workbook(template_path)
    employee = payload.get("employee", {})
    sections = payload.get("sections", {})
    family = single_payload(sections, "family")

    c1 = wb["C1"]
    clear_cells(
        c1,
        [
            "D10",
            "D11",
            "N11",
            "D12",
            "D13",
            "D15",
            "D16",
            "D17",
            "D22",
            "D24",
            "D25",
            "D27",
            "D29",
            "D31",
            "D32",
            "D33",
            "D34",
            "H13",
            "I13",
            "K13",
            "K14",
            "L14",
            "M15",
            "N15",
            "I19",
            "L19",
            "I22",
            "L22",
            "I23",
            "L23",
            "I24",
            "I27",
            "L27",
            "I28",
            "L28",
            "I30",
            "L30",
            "I31",
            "I32",
            "I33",
            "I34",
            "D36",
            "D37",
            "G37",
            "D38",
            "D39",
            "D40",
            "D41",
            "D42",
            "D43",
            "D44",
            "G44",
            "D45",
            "D47",
            "D48",
            "D49",
        ],
    )
    for row in range(37, 49):
        clear_cells(c1, [f"I{row}", f"M{row}"])
    initialize_na(
        c1,
        [
            "D10",
            "D11",
            "N11",
            "D12",
            "D13",
            "D15",
            "D16",
            "D17",
            "D22",
            "D24",
            "D25",
            "D27",
            "D29",
            "D31",
            "D32",
            "D33",
            "D34",
            "I19",
            "I24",
            "I27",
            "I31",
            "I32",
            "I33",
            "I34",
            "D36",
            "D37",
            "D38",
            "D39",
            "D40",
            "D41",
            "D42",
            "D43",
            "D44",
            "D45",
            "D47",
            "D48",
            "D49",
        ],
    )
    c1["J13"] = "FILIPINO"
    c1["I36"] = "23. NAME of CHILDREN  (Write full name and list all)"
    c1["B13"] = "DATE OF BIRTH \n(mm/dd/yyyy)  "
    c1["M36"] = "DATE OF BIRTH (mm/dd/yyyy)"

    set_cell(c1, "D10", employee.get("lastname"))
    set_cell(c1, "D11", employee.get("firstname"))
    set_cell(c1, "N11", employee.get("nameExt"))
    set_cell(c1, "D12", employee.get("middlename"))
    set_cell(c1, "D13", date_text(employee.get("birthday")))
    set_cell(c1, "D15", employee.get("placeOfBirth"))
    set_cell(c1, "D16", employee.get("gender"))
    set_cell(c1, "D17", employee.get("civilStatus"))
    set_cell(c1, "D22", number_text(employee.get("height")))
    set_cell(c1, "D24", number_text(employee.get("weight")))
    set_cell(c1, "D25", employee.get("bloodType"))
    set_cell(c1, "D27", employee.get("gsis"))
    set_cell(c1, "D29", employee.get("pagibig"))
    set_cell(c1, "D31", employee.get("philhealth"))
    set_cell(c1, "D33", employee.get("tin"))
    set_cell(c1, "D34", employee.get("employeeId"))
    citizenship = text(employee.get("citizenship"))
    if citizenship and "filipino" not in citizenship.lower():
        mark_cell(c1, "K13")
        set_cell(c1, "M15", employee.get("citizenship"))
    set_cell(c1, "I19", employee.get("residentialAddress"))
    set_cell(c1, "I24", employee.get("residentialZipcode"))
    set_cell(c1, "I27", employee.get("permanentAddress"))
    set_cell(c1, "I31", employee.get("permanentZipcode"))
    set_cell(c1, "I32", first(employee.get("residentialTelNo"), employee.get("permanentTelNo")))
    set_cell(c1, "I33", employee.get("cellphoneNo"))
    set_cell(c1, "I34", employee.get("email"))

    set_cell(c1, "D36", family.get("spouseLastname"))
    set_cell(c1, "D37", family.get("spouseFirstname"))
    set_cell(c1, "D38", family.get("spouseMiddlename"))
    set_cell(c1, "D39", family.get("spouseOccupation"))
    set_cell(c1, "D40", family.get("spouseEmployer"))
    set_cell(c1, "D41", family.get("spouseBusinessAddress"))
    set_cell(c1, "D42", family.get("spouseBusinessTel"))
    set_cell(c1, "D43", family.get("fatherLastname"))
    set_cell(c1, "D44", family.get("fatherFirstname"))
    set_cell(c1, "D45", family.get("fatherMiddlename"))
    set_cell(c1, "D47", family.get("motherLastname"))
    set_cell(c1, "D48", family.get("motherFirstname"))
    set_cell(c1, "D49", family.get("motherMiddlename"))
    fill_rows(
        c1,
        section_payloads(sections, "children"),
        37,
        12,
        [("I", split_name), ("M", lambda item: date_text(item.get("birthday")))],
    )
    fill_education(c1, section_payloads(sections, "education"))
    clear_cells(c1, ["D60", "J60", "L60"])

    c2 = wb["C2"]
    c2["G3"] = "DATE OF EXAMINATION / CONFERMENT (mm/dd/yyyy)"
    c2["B15"] = "INCLUSIVE DATES (mm/dd/yyyy)"
    fill_rows(
        c2,
        section_payloads(sections, "civilService"),
        5,
        7,
        [
            ("A", lambda item: get_any(item, "type", "eligibility")),
            ("F", "rating"),
            ("G", lambda item: date_text(item.get("date"))),
            ("I", "place"),
            ("J", lambda item: get_any(item, "license", "license_no")),
            ("K", lambda item: date_text(first(item.get("licenseValidity"), item.get("validity"), item.get("dateRelease")))),
        ],
    )
    fill_rows(
        c2,
        sort_current_first(section_payloads(sections, "work")),
        18,
        28,
        [
            ("A", lambda item: date_text(item.get("dateFrom"))),
            ("C", lambda item: date_text(item.get("dateTo"))),
            ("D", "position"),
            ("G", "company"),
            ("J", "status"),
            ("K", lambda item: normalize_gov_service(item.get("govEmp"))),
        ],
    )
    clear_cells(c2, ["D47", "I47"])

    c3 = wb["C3"]
    fill_rows(
        c3,
        section_payloads(sections, "organization"),
        6,
        7,
        [
            ("A", lambda item: " - ".join(part for part in [text(item.get("name")), text(item.get("address"))] if part)),
            ("E", lambda item: date_text(item.get("yearFrom"))),
            ("F", lambda item: date_text(item.get("yearTo"))),
            ("G", "hours"),
            ("H", "position"),
        ],
    )
    fill_rows(
        c3,
        sort_current_first(section_payloads(sections, "training")),
        18,
        21,
        [
            ("A", "name"),
            ("E", lambda item: date_text(item.get("yearFrom"))),
            ("F", lambda item: date_text(item.get("yearTo"))),
            ("G", "hours"),
            ("H", lambda item: get_any(item, "type", "category")),
            ("I", "conductedBy"),
        ],
    )
    clear_cells(c3, ["C50", "G50"])

    c4 = wb["C4"]
    clear_cells(c4, ["D61", "D62", "D64", "F60", "F65"])
    set_cell(c4, "D61", first("GSIS", "SSS", "TIN"))
    set_cell(c4, "D62", first(employee.get("gsis"), employee.get("sss"), employee.get("tin")))
    set_cell(c4, "D64", first(employee.get("ctcPlaceIssued"), employee.get("agency")))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wb.save(output_path)
    restore_c4_checkboxes(template_path, output_path)


def restore_c4_checkboxes(template_path, output_path):
    with zipfile.ZipFile(template_path, "r") as template:
        template_names = set(template.namelist())
        required = {
            "xl/worksheets/sheet4.xml",
            "xl/worksheets/_rels/sheet4.xml.rels",
            "xl/drawings/vmlDrawing2.vml",
            "xl/drawings/drawing2.xml",
            "[Content_Types].xml",
        }
        if not required.issubset(template_names):
            return
        control_parts = [name for name in template_names if name.startswith("xl/ctrlProps/")]
        copied_parts = {
            "xl/worksheets/_rels/sheet4.xml.rels",
            "xl/drawings/vmlDrawing2.vml",
            "xl/drawings/drawing2.xml",
            *control_parts,
        }
        sheet4_additions = extract_c4_control_xml(template.read("xl/worksheets/sheet4.xml").decode("utf-8", errors="ignore"))
        content_type_xml = patch_content_types(
            read_zip_text(output_path, "[Content_Types].xml"),
            template.read("[Content_Types].xml").decode("utf-8", errors="ignore"),
            copied_parts,
        )

        fd, temp_output = tempfile.mkstemp(suffix=".xlsx")
        os.close(fd)
        try:
            with zipfile.ZipFile(output_path, "r") as source:
                with zipfile.ZipFile(temp_output, "w", zipfile.ZIP_DEFLATED) as target:
                    for item in source.infolist():
                        if item.filename in copied_parts:
                            continue
                        data = source.read(item.filename)
                        if item.filename == "xl/worksheets/sheet4.xml":
                            data = patch_sheet4_controls(data.decode("utf-8", errors="ignore"), sheet4_additions).encode("utf-8")
                        elif item.filename == "[Content_Types].xml":
                            data = content_type_xml.encode("utf-8")
                        target.writestr(item, data)
                    for part in sorted(copied_parts):
                        if part in template_names:
                            target.writestr(part, template.read(part))
            shutil.move(temp_output, output_path)
        finally:
            if os.path.exists(temp_output):
                os.remove(temp_output)


def read_zip_text(path, name):
    with zipfile.ZipFile(path, "r") as workbook:
        return workbook.read(name).decode("utf-8", errors="ignore")


def extract_c4_control_xml(sheet_xml):
    fragments = []
    for tag in ("drawing", "legacyDrawing", "controls"):
        match = re.search(rf"<{tag}\b[\s\S]*?(?:/>|</{tag}>)", sheet_xml)
        if match:
            fragments.append(match.group(0))
    return "".join(fragments)


def patch_sheet4_controls(sheet_xml, additions):
    if not additions:
        return sheet_xml
    sheet_xml = re.sub(r"<drawing\b[\s\S]*?(?:/>|</drawing>)", "", sheet_xml)
    sheet_xml = re.sub(r"<legacyDrawing\b[\s\S]*?(?:/>|</legacyDrawing>)", "", sheet_xml)
    sheet_xml = re.sub(r"<controls\b[\s\S]*?</controls>", "", sheet_xml)
    sheet_xml = ensure_sheet4_namespaces(sheet_xml)
    return sheet_xml.replace("</worksheet>", f"{additions}</worksheet>")


def ensure_sheet4_namespaces(sheet_xml):
    match = re.search(r"<worksheet\b[^>]*>", sheet_xml)
    if not match:
        return sheet_xml
    tag = match.group(0)
    additions = {
        "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        "xmlns:xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
        "xmlns:x14": "http://schemas.microsoft.com/office/spreadsheetml/2009/9/main",
        "xmlns:mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
    }
    patched = tag
    for name, uri in additions.items():
        if f"{name}=" not in patched:
            patched = patched[:-1] + f' {name}="{uri}">'
    if "mc:Ignorable=" not in patched:
        patched = patched[:-1] + ' mc:Ignorable="x14">'
    return sheet_xml[: match.start()] + patched + sheet_xml[match.end() :]


def patch_content_types(content_xml, template_content_xml, copied_parts):
    for match in re.finditer(r'<Default\b[^>]+Extension="vml"[^>]*/>', template_content_xml):
        fragment = match.group(0)
        if 'Extension="vml"' not in content_xml:
            content_xml = content_xml.replace("</Types>", f"{fragment}</Types>")
    for part in copied_parts:
        part_name = f"/{part}"
        if part_name in content_xml:
            continue
        pattern = rf'<Override\b[^>]+PartName="{re.escape(part_name)}"[^>]*/>'
        match = re.search(pattern, template_content_xml)
        if match:
            content_xml = content_xml.replace("</Types>", f"{match.group(0)}</Types>")
    return content_xml


def main():
    if len(sys.argv) != 4:
        print("Usage: pds_excel.py <input-json> <output-xlsx> <template-xlsx>", file=sys.stderr)
        return 2
    with open(sys.argv[1], "r", encoding="utf-8-sig") as handle:
        payload = json.load(handle)
    fill_sheet(payload, sys.argv[2], sys.argv[3])
    print(sys.argv[2])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
