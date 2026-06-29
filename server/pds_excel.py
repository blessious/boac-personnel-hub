import json
import os
import sys
import re
import zipfile
from datetime import datetime
import xml.etree.ElementTree as ET


SHEET_FILES = {
    "C1": "xl/worksheets/sheet1.xml",
    "C2": "xl/worksheets/sheet2.xml",
    "C3": "xl/worksheets/sheet3.xml",
    "C4": "xl/worksheets/sheet4.xml",
}

PDS_CHECKBOXES = {
    "citizenship_filipino": "_x0000_s1045",
    "citizenship_dual": "_x0000_s1046",
    "citizenship_by_birth": "_x0000_s1063",
    "citizenship_by_naturalization": "_x0000_s1064",
    "sex_male": "_x0000_s1049",
    "sex_female": "_x0000_s1050",
    "civil_single": "_x0000_s1058",
    "civil_married": "_x0000_s1059",
    "civil_widowed": "_x0000_s1060",
    "civil_other": "_x0000_s1061",
    "civil_separated": "_x0000_s1062",
}

PDS_CHECKBOX_IDS = set(PDS_CHECKBOXES.values())

SHEET_NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
    "x14": "http://schemas.microsoft.com/office/spreadsheetml/2009/9/main",
    "x14ac": "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac",
    "xr": "http://schemas.microsoft.com/office/spreadsheetml/2014/revision",
    "xr6": "http://schemas.microsoft.com/office/spreadsheetml/2016/revision6",
    "xr10": "http://schemas.microsoft.com/office/spreadsheetml/2016/revision10",
    "xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing",
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


def full_name(payload):
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
    return " ".join(
        part
        for part in [text(payload.get("firstname")), text(payload.get("middlename")), text(payload.get("lastname"))]
        if part
    )


def set_cell(cells, ref, value):
    value = text(value)
    if not value:
        return
    cells[ref] = value


def clear_cells(cells, refs):
    for ref in refs:
        cells[ref] = ""


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


def fill_sheet(payload, output_path, template_path):
    employee = payload.get("employee", {})
    sections = payload.get("sections", {})
    family = single_payload(sections, "family")
    sheet_cells = {path: {} for path in SHEET_FILES.values()}

    c1 = sheet_cells[SHEET_FILES["C1"]]
    clear_cells(
        c1,
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
        clear_cells(c1, [f"I{row}", f"M{row}"])

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
    citizenship = text(employee.get("citizenship")).lower()
    if citizenship and "filipino" not in citizenship:
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

    c2 = sheet_cells[SHEET_FILES["C2"]]
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
    clear_cells(c2, ["D47", "I47"])

    c3 = sheet_cells[SHEET_FILES["C3"]]
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
    clear_cells(c3, ["C50", "G50"])

    c4 = sheet_cells[SHEET_FILES["C4"]]
    clear_cells(c4, ["D61", "D62", "D64", "F60", "F65"])
    set_cell(c4, "D61", first("GSIS", "SSS", "TIN"))
    set_cell(c4, "D62", first(employee.get("gsis"), employee.get("sss"), employee.get("tin")))
    set_cell(c4, "D64", first(employee.get("ctcPlaceIssued"), employee.get("agency")))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    write_xlsx(template_path, output_path, sheet_cells, selected_checkbox_ids(employee))


def selected_checkbox_ids(employee):
    selected = set()

    gender = text(employee.get("gender")).lower()
    if "female" in gender or gender == "f":
        selected.add(PDS_CHECKBOXES["sex_female"])
    elif "male" in gender or gender == "m":
        selected.add(PDS_CHECKBOXES["sex_male"])

    civil_status = text(employee.get("civilStatus")).lower()
    if "single" in civil_status:
        selected.add(PDS_CHECKBOXES["civil_single"])
    elif "married" in civil_status:
        selected.add(PDS_CHECKBOXES["civil_married"])
    elif "widow" in civil_status:
        selected.add(PDS_CHECKBOXES["civil_widowed"])
    elif "separated" in civil_status:
        selected.add(PDS_CHECKBOXES["civil_separated"])
    elif civil_status:
        selected.add(PDS_CHECKBOXES["civil_other"])

    citizenship = text(employee.get("citizenship")).lower()
    if not citizenship or "filipino" in citizenship:
        selected.add(PDS_CHECKBOXES["citizenship_filipino"])
    else:
        selected.add(PDS_CHECKBOXES["citizenship_dual"])
        if "natural" in citizenship:
            selected.add(PDS_CHECKBOXES["citizenship_by_naturalization"])
        else:
            selected.add(PDS_CHECKBOXES["citizenship_by_birth"])

    return selected


def write_xlsx(template_path, output_path, sheet_cells, selected_ids):
    with zipfile.ZipFile(template_path, "r") as source:
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as target:
            for item in source.infolist():
                data = source.read(item.filename)
                if item.filename in sheet_cells:
                    data = patch_sheet(data, sheet_cells[item.filename])
                elif item.filename == "xl/drawings/vmlDrawing1.vml":
                    data = patch_vml(data.decode("utf-8", errors="ignore"), selected_ids).encode("utf-8")
                target.writestr(item, data)


def patch_sheet(sheet_xml, cells):
    register_sheet_namespaces(sheet_xml)
    root = ET.fromstring(sheet_xml)
    root.set("xmlns:x14", SHEET_NS["x14"])
    sheet_data = root.find("main:sheetData", SHEET_NS)
    if sheet_data is None:
        return sheet_xml
    for ref, value in cells.items():
        if text(value):
            set_cell_inline_string(sheet_data, ref, value)
        else:
            clear_cell(sheet_data, ref)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def register_sheet_namespaces(sheet_xml):
    xml_text = sheet_xml.decode("utf-8", errors="ignore")
    ET.register_namespace("", SHEET_NS["main"])
    for prefix, uri in SHEET_NS.items():
        if prefix != "main":
            ET.register_namespace(prefix, uri)
    for prefix, uri in re.findall(r'xmlns:([A-Za-z0-9]+)="([^"]+)"', xml_text):
        if prefix != "xml":
            try:
                ET.register_namespace(prefix, uri)
            except ValueError:
                pass


def set_cell_inline_string(sheet_data, ref, value):
    row_number = int(re.search(r"\d+", ref).group(0))
    row = find_or_create_row(sheet_data, row_number)
    cell = find_or_create_cell(row, ref)
    for child in list(cell):
        cell.remove(child)
    cell.attrib["t"] = "inlineStr"
    inline = ET.SubElement(cell, f"{{{SHEET_NS['main']}}}is")
    text_node = ET.SubElement(inline, f"{{{SHEET_NS['main']}}}t")
    value = text(value)
    text_node.text = value
    if "\n" in value or value.startswith(" ") or value.endswith(" "):
        text_node.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


def clear_cell(sheet_data, ref):
    row_number = int(re.search(r"\d+", ref).group(0))
    row = find_row(sheet_data, row_number)
    if row is None:
        return
    cell = find_cell(row, ref)
    if cell is None:
        return
    for child in list(cell):
        cell.remove(child)
    cell.attrib.pop("t", None)


def find_row(sheet_data, row_number):
    for row in sheet_data.findall("main:row", SHEET_NS):
        if int(row.attrib.get("r", "0")) == row_number:
            return row
    return None


def find_or_create_row(sheet_data, row_number):
    existing = find_row(sheet_data, row_number)
    if existing is not None:
        return existing
    row = ET.Element(f"{{{SHEET_NS['main']}}}row", {"r": str(row_number)})
    inserted = False
    for index, current in enumerate(list(sheet_data)):
        if current.tag.endswith("row") and int(current.attrib.get("r", "0")) > row_number:
            sheet_data.insert(index, row)
            inserted = True
            break
    if not inserted:
        sheet_data.append(row)
    return row


def find_cell(row, ref):
    for cell in row.findall("main:c", SHEET_NS):
        if cell.attrib.get("r") == ref:
            return cell
    return None


def find_or_create_cell(row, ref):
    existing = find_cell(row, ref)
    if existing is not None:
        return existing
    cell = ET.Element(f"{{{SHEET_NS['main']}}}c", {"r": ref})
    target_col = column_index(ref)
    inserted = False
    for index, current in enumerate(list(row)):
        if current.tag.endswith("c") and column_index(current.attrib.get("r", "A1")) > target_col:
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


def patch_vml(vml, selected_ids):
    def replace_shape(match):
        shape = re.sub(r"\s*<x:Checked>1\s*</x:Checked>", "", match.group(0))
        shape_id = match.group("id")
        if shape_id in selected_ids:
            shape = shape.replace("</x:ClientData>", "   <x:Checked>1</x:Checked>\n  </x:ClientData>")
        return shape

    pattern = r'<v:shape\b[^>]*id="(?P<id>[^"]+)"[\s\S]*?</v:shape>'
    return re.sub(
        pattern,
        lambda match: replace_shape(match) if match.group("id") in PDS_CHECKBOX_IDS else match.group(0),
        vml,
    )


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
