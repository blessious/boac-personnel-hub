import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime


SHEET_FILES = {
    "C1": "xl/worksheets/sheet1.xml",
    "C2": "xl/worksheets/sheet2.xml",
    "C3": "xl/worksheets/sheet3.xml",
    "C4": "xl/worksheets/sheet4.xml",
}

PDS_CHECKBOXES = {
    "male": "_x0000_s2049",
    "female": "_x0000_s2050",
    "single": "_x0000_s2051",
    "married": "_x0000_s2052",
    "widowed": "_x0000_s2053",
    "other": "_x0000_s2054",
    "separated": "_x0000_s2055",
    "filipino": "_x0000_s2057",
    "dual": "_x0000_s2058",
    "by_birth": "_x0000_s2059",
    "by_naturalization": "_x0000_s2060",
}


def text(value):
    if value is None:
        return ""
    return str(value).strip()


def first(*values):
    for value in values:
        value = text(value)
        if value:
            return value
    return ""


def date_text(value):
    value = text(value)
    if not value:
        return ""
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized).strftime("%d/%m/%Y")
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(value, fmt).strftime("%d/%m/%Y")
        except ValueError:
            pass
    return value


def number_text(value):
    value = text(value)
    if not value:
        return ""
    try:
        number = float(value)
    except ValueError:
        return value
    if number.is_integer():
        return str(int(number))
    return f"{number:.3f}".rstrip("0").rstrip(".")


def section_payloads(sections, key):
    return [row.get("payload", {}) for row in sections.get(key, []) if isinstance(row, dict)]


def single_payload(sections, key):
    rows = section_payloads(sections, key)
    return rows[0] if rows else {}


def split_name(payload):
    return " ".join(
        part
        for part in [text(payload.get("firstname")), text(payload.get("middlename")), text(payload.get("lastname"))]
        if part
    )


def set_cell(cells, ref, value):
    value = text(value)
    if value:
        cells[ref] = value


def clear_cells(clears, refs):
    clears.update(refs)


def fill_education(cells, rows):
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
        set_cell(cells, f"D{target}", item.get("school"))
        set_cell(cells, f"G{target}", item.get("degree"))
        set_cell(cells, f"J{target}", item.get("yearFrom"))
        set_cell(cells, f"K{target}", item.get("yearTo"))
        set_cell(cells, f"L{target}", item.get("highest") or item.get("units"))
        set_cell(cells, f"M{target}", item.get("yearGraduated"))
        set_cell(cells, f"N{target}", item.get("scholarship"))


def fill_rows(cells, rows, start_row, max_rows, mapping):
    for index, item in enumerate(rows[:max_rows]):
        row = start_row + index
        for col, key in mapping:
            value = key(item) if callable(key) else item.get(key)
            set_cell(cells, f"{col}{row}", value)


def selected_checkbox_ids(employee):
    selected = set()
    gender = text(employee.get("gender")).lower()
    if gender in {"male", "m"}:
        selected.add(PDS_CHECKBOXES["male"])
    elif gender in {"female", "f"}:
        selected.add(PDS_CHECKBOXES["female"])

    civil_status = text(employee.get("civilStatus")).lower()
    if civil_status in {"single", "married", "widowed", "separated"}:
        selected.add(PDS_CHECKBOXES[civil_status])
    elif civil_status:
        selected.add(PDS_CHECKBOXES["other"])

    citizenship = text(employee.get("citizenship")).lower()
    if not citizenship or "filipino" in citizenship:
        selected.add(PDS_CHECKBOXES["filipino"])
    else:
        selected.add(PDS_CHECKBOXES["dual"])
        if "natural" in citizenship:
            selected.add(PDS_CHECKBOXES["by_naturalization"])
        else:
            selected.add(PDS_CHECKBOXES["by_birth"])

    return selected


def build_workbook_patch(payload):
    employee = payload.get("employee", {})
    sections = payload.get("sections", {})
    family = single_payload(sections, "family")
    cells_by_sheet = {sheet: {} for sheet in SHEET_FILES}
    clears_by_sheet = {sheet: set() for sheet in SHEET_FILES}

    c1 = cells_by_sheet["C1"]
    c1_clears = clears_by_sheet["C1"]
    clear_cells(
        c1_clears,
        [
            "D10",
            "D11",
            "O11",
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
        clear_cells(c1_clears, [f"I{row}", f"M{row}"])
    set_cell(c1, "I36", "23. NAME of CHILDREN  (Write full name and list all)")
    set_cell(c1, "M36", "DATE OF BIRTH (dd/mm/yyyy)")

    set_cell(c1, "D10", employee.get("lastname"))
    set_cell(c1, "D11", employee.get("firstname"))
    set_cell(c1, "O11", employee.get("nameExt"))
    set_cell(c1, "D12", employee.get("middlename"))
    set_cell(c1, "D13", date_text(employee.get("birthday")))
    set_cell(c1, "D15", employee.get("placeOfBirth"))
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
        set_cell(c1, "M15", citizenship)

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
    clear_cells(c1_clears, ["D60", "J60", "L60"])

    c2 = cells_by_sheet["C2"]
    fill_rows(
        c2,
        section_payloads(sections, "civilService"),
        5,
        7,
        [
            ("A", "type"),
            ("F", "rating"),
            ("G", lambda item: date_text(item.get("date"))),
            ("I", "place"),
            ("J", "license"),
            ("K", lambda item: date_text(first(item.get("licenseValidity"), item.get("dateRelease")))),
        ],
    )
    fill_rows(
        c2,
        section_payloads(sections, "work"),
        18,
        28,
        [
            ("A", lambda item: date_text(item.get("dateFrom"))),
            ("C", lambda item: date_text(item.get("dateTo"))),
            ("D", "position"),
            ("G", "company"),
            ("J", "status"),
            ("K", "govEmp"),
        ],
    )
    clear_cells(clears_by_sheet["C2"], ["D47", "I47"])

    c3 = cells_by_sheet["C3"]
    fill_rows(
        c3,
        section_payloads(sections, "organization"),
        6,
        7,
        [
            ("A", lambda item: " - ".join(part for part in [text(item.get("name")), text(item.get("address"))] if part)),
            ("E", "yearFrom"),
            ("F", "yearTo"),
            ("G", "hours"),
            ("H", "position"),
        ],
    )
    fill_rows(
        c3,
        section_payloads(sections, "training"),
        18,
        21,
        [
            ("A", "name"),
            ("E", "yearFrom"),
            ("F", "yearTo"),
            ("G", "hours"),
            ("I", "conductedBy"),
        ],
    )
    clear_cells(clears_by_sheet["C3"], ["C50", "G50"])

    c4 = cells_by_sheet["C4"]
    clear_cells(clears_by_sheet["C4"], ["D61", "D62", "D64", "F60", "F65"])
    set_cell(c4, "D61", first("GSIS", "SSS", "TIN"))
    set_cell(c4, "D62", first(employee.get("gsis"), employee.get("sss"), employee.get("tin")))
    set_cell(c4, "D64", first(employee.get("ctcPlaceIssued"), employee.get("agency")))

    return cells_by_sheet, clears_by_sheet, selected_checkbox_ids(employee)


def write_xlsx(template_path, output_path, cells_by_sheet, clears_by_sheet, selected_ids):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with zipfile.ZipFile(template_path, "r") as source:
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as target:
            for item in source.infolist():
                data = source.read(item.filename)
                sheet_name = next(
                    (name for name, filename in SHEET_FILES.items() if filename == item.filename),
                    None,
                )
                if sheet_name:
                    data = patch_sheet(data, cells_by_sheet[sheet_name], clears_by_sheet[sheet_name])
                elif item.filename == "xl/drawings/vmlDrawing1.vml":
                    data = patch_vml(data.decode("utf-8", errors="ignore"), selected_ids).encode("utf-8")
                target.writestr(item, data)


def patch_sheet(sheet_xml, cells, clears):
    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    ET.register_namespace("", ns["main"])
    ET.register_namespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    ET.register_namespace("mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")
    ET.register_namespace("x14ac", "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac")
    root = ET.fromstring(sheet_xml)
    sheet_data = root.find("main:sheetData", ns)
    if sheet_data is None:
        return sheet_xml
    for ref in sorted(clears, key=cell_sort_key):
        clear_cell(sheet_data, ref, ns)
    for ref, value in sorted(cells.items(), key=lambda item: cell_sort_key(item[0])):
        set_cell_inline_string(sheet_data, ref, value, ns)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def clear_cell(sheet_data, ref, ns):
    row_number = int(re.search(r"\d+", ref).group(0))
    row = find_or_create_row(sheet_data, row_number, ns)
    cell = find_or_create_cell(row, ref, ns)
    for child in list(cell):
        cell.remove(child)
    cell.attrib.pop("t", None)


def set_cell_inline_string(sheet_data, ref, value, ns):
    row_number = int(re.search(r"\d+", ref).group(0))
    row = find_or_create_row(sheet_data, row_number, ns)
    cell = find_or_create_cell(row, ref, ns)
    for child in list(cell):
        cell.remove(child)
    cell.attrib["t"] = "inlineStr"
    inline = ET.SubElement(cell, f"{{{ns['main']}}}is")
    text_node = ET.SubElement(inline, f"{{{ns['main']}}}t")
    text_node.text = text(value)
    if "\n" in text(value) or text(value).startswith(" ") or text(value).endswith(" "):
        text_node.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


def find_or_create_row(sheet_data, row_number, ns):
    for row in sheet_data.findall("main:row", ns):
        if int(row.attrib.get("r", "0")) == row_number:
            return row
    row = ET.Element(f"{{{ns['main']}}}row", {"r": str(row_number)})
    inserted = False
    for index, existing in enumerate(list(sheet_data)):
        if existing.tag.endswith("row") and int(existing.attrib.get("r", "0")) > row_number:
            sheet_data.insert(index, row)
            inserted = True
            break
    if not inserted:
        sheet_data.append(row)
    return row


def find_or_create_cell(row, ref, ns):
    for cell in row.findall("main:c", ns):
        if cell.attrib.get("r") == ref:
            return cell
    cell = ET.Element(f"{{{ns['main']}}}c", {"r": ref})
    target_col = column_index(ref)
    inserted = False
    for index, existing in enumerate(list(row)):
        if existing.tag.endswith("c") and column_index(existing.attrib.get("r", "A1")) > target_col:
            row.insert(index, cell)
            inserted = True
            break
    if not inserted:
        row.append(cell)
    return cell


def column_index(ref):
    letters = re.match(r"[A-Z]+", ref).group(0)
    number = 0
    for char in letters:
        number = number * 26 + (ord(char) - 64)
    return number


def cell_sort_key(ref):
    row = int(re.search(r"\d+", ref).group(0))
    return (row, column_index(ref))


def patch_vml(vml, selected_ids):
    all_ids = set(PDS_CHECKBOXES.values())

    def replace_shape(match):
        shape_id = match.group("id")
        body = re.sub(r"\s*<x:Checked>1\s*</x:Checked>", "", match.group(0))
        if shape_id in selected_ids:
            body = body.replace("</x:ClientData>", "   <x:Checked>1</x:Checked>\n  </x:ClientData>")
        return body

    pattern = r'<v:shape\b[^>]*id="(?P<id>[^"]+)"[\s\S]*?</v:shape>'
    return re.sub(
        pattern,
        lambda match: replace_shape(match) if match.group("id") in all_ids else match.group(0),
        vml,
    )


def fill_sheet(payload, output_path, template_path):
    cells_by_sheet, clears_by_sheet, selected_ids = build_workbook_patch(payload)
    write_xlsx(template_path, output_path, cells_by_sheet, clears_by_sheet, selected_ids)


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
