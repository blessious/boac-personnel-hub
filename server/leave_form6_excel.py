import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET


LEAVE_CHECKBOXES = {
    "VL": "_x0000_s1029",
    "FL": "_x0000_s1027",
    "SL": "_x0000_s1028",
    "ML": "_x0000_s1030",
    "PL": "_x0000_s1031",
    "SPL": "_x0000_s1032",
    "SP": "_x0000_s1033",
    "STUDY": "_x0000_s1034",
    "VAWC": "_x0000_s1035",
    "REHAB": "_x0000_s1036",
    "SLBW": "_x0000_s1037",
    "CALAMITY": "_x0000_s1038",
    "ADOPTION": "_x0000_s1039",
}

DETAIL_CHECKBOXES = {
    "location_philippines": "_x0000_s1040",
    "location_abroad": "_x0000_s1041",
    "sick_hospital": "_x0000_s1042",
    "sick_outpatient": "_x0000_s1043",
    "study_masters": "_x0000_s1044",
    "study_board": "_x0000_s1045",
    "purpose_monetization": "_x0000_s1046",
    "purpose_terminal": "_x0000_s1047",
    "commutation_not_requested": "_x0000_s1048",
    "commutation_requested": "_x0000_s1049",
    "recommend_for_approval": "_x0000_s1050",
    "recommend_for_disapproval": "_x0000_s1051",
}


def text(value):
    return "" if value is None else str(value)


def number_text(value):
    if value is None or value == "":
        return ""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return text(value)
    if number.is_integer():
        return str(int(number))
    return f"{number:.3f}".rstrip("0").rstrip(".")


def full_name(employee, application):
    lastname = employee.get("lastname") or ""
    firstname = employee.get("firstname") or ""
    middlename = employee.get("middlename") or ""
    name_ext = employee.get("nameExt") or ""
    if lastname or firstname:
        first = " ".join(part for part in [firstname, name_ext] if part)
        return f"{lastname}, {first} {middlename}".strip()
    return application.get("employeeName") or ""


def inclusive_dates(application):
    start = application.get("dateFrom") or ""
    end = application.get("dateTo") or ""
    if start and end and start != end:
        return f"{start} to {end}"
    return start or end


def set_wrapped(sheet, cell, value):
    sheet[cell] = value
    sheet[cell].alignment = sheet[cell].alignment.copy(wrap_text=True)


def fill_sheet(payload, output_path, template_path):
    application = payload["application"]
    employee = payload.get("employee", {})
    agency = payload.get("agency", {})
    balances = payload.get("balances", {})
    cells = {}

    cells["A2"] = "\n".join(
            part
            for part in [
                "Republic of the Philippines",
                agency.get("name") or "(Agency Name)",
                agency.get("tagline") or "(Agency Address)",
            ]
            if part
    )
    cells["B5"] = application.get("department") or employee.get("department") or ""
    cells["E5"] = full_name(employee, application)
    cells["A6"] = f"3.   DATE OF FILING  {application.get('createdAt', '')[:10]}"
    cells["E6"] = (
        f"4.   POSITION  {application.get('position') or employee.get('position') or ''}     "
        f"5.  SALARY  {number_text(application.get('salarySnapshot'))}"
    )

    location_type = application.get("detailLocationType") or ""
    location_text = application.get("detailLocationText") or ""
    sick_type = application.get("detailSickType") or ""
    illness = application.get("detailIllness") or ""
    study_purpose = application.get("detailStudyPurpose") or ""
    other_purpose = application.get("detailOtherPurpose") or ""
    other_text = application.get("detailOtherText") or ""

    if location_type == "Philippines":
        cells["I13"] = "Within the Philippines: Philippines"
    if location_type == "Abroad":
        cells["I15"] = f"Abroad (Specify): {location_text}"
    if sick_type == "Hospital":
        cells["I19"] = f"In Hospital (Specify Illness): {illness}"
    if sick_type == "OutPatient":
        cells["I21"] = f"Out Patient (Specify Illness): {illness}"
    if application.get("leaveCode") == "SLBW" and illness:
        cells["H27"] = f"(Specify Illness): {illness}"
    if other_purpose == "Other" and other_text:
        cells["B41"] = other_text

    cells["B45"] = number_text(application.get("daysRequested"))
    cells["B48"] = inclusive_dates(application)

    vl = balances.get("VL", {})
    sl = balances.get("SL", {})
    cells["C53"] = f"As of {payload.get('asOfDate') or ''}"
    cells["D56"] = number_text(vl.get("earned"))
    cells["E56"] = number_text(sl.get("earned"))
    cells["D57"] = number_text(vl.get("less"))
    cells["E57"] = number_text(sl.get("less"))
    cells["D58"] = number_text(vl.get("balance"))
    cells["E58"] = number_text(sl.get("balance"))

    if application.get("recommendationReason"):
        cells["I55"] = f"For disapproval due to {application.get('recommendationReason')}"
    if application.get("approvedDaysWithPay") is not None:
        cells["C62"] = f"{number_text(application.get('approvedDaysWithPay'))} days with pay"
    if application.get("approvedDaysWithoutPay") is not None:
        cells["C63"] = f"{number_text(application.get('approvedDaysWithoutPay'))} days without pay"
    if application.get("approvedDaysOther") is not None:
        cells["C64"] = (
            f"{number_text(application.get('approvedDaysOther'))} others "
            f"{application.get('approvedDaysOtherText') or ''}"
        ).strip()
    if application.get("finalDisapprovalReason"):
        cells["I62"] = application.get("finalDisapprovalReason")
    elif application.get("decisionRemarks"):
        cells["I62"] = application.get("decisionRemarks")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    write_xlsx(template_path, output_path, cells, selected_checkbox_ids(application))


def selected_checkbox_ids(application):
    selected = set()
    leave_code = application.get("leaveCode") or ""
    if leave_code in LEAVE_CHECKBOXES:
        selected.add(LEAVE_CHECKBOXES[leave_code])
    elif leave_code in {"MONETIZATION", "TERMINAL", "OTHERS", "LWOP"}:
        # The official form has one write-in "Others" line plus separate purpose checkboxes.
        pass

    location_type = application.get("detailLocationType") or ""
    if location_type == "Philippines":
        selected.add(DETAIL_CHECKBOXES["location_philippines"])
    if location_type == "Abroad":
        selected.add(DETAIL_CHECKBOXES["location_abroad"])

    sick_type = application.get("detailSickType") or ""
    if sick_type == "Hospital":
        selected.add(DETAIL_CHECKBOXES["sick_hospital"])
    if sick_type == "OutPatient":
        selected.add(DETAIL_CHECKBOXES["sick_outpatient"])

    study_purpose = application.get("detailStudyPurpose") or ""
    if study_purpose == "MastersDegree":
        selected.add(DETAIL_CHECKBOXES["study_masters"])
    if study_purpose == "BarBoardReview":
        selected.add(DETAIL_CHECKBOXES["study_board"])

    other_purpose = application.get("detailOtherPurpose") or ""
    leave_code = application.get("leaveCode") or ""
    if other_purpose == "Monetization" or leave_code == "MONETIZATION":
        selected.add(DETAIL_CHECKBOXES["purpose_monetization"])
    if other_purpose == "TerminalLeave" or leave_code == "TERMINAL":
        selected.add(DETAIL_CHECKBOXES["purpose_terminal"])

    if application.get("commutationRequested"):
        selected.add(DETAIL_CHECKBOXES["commutation_requested"])
    else:
        selected.add(DETAIL_CHECKBOXES["commutation_not_requested"])

    if application.get("recommendationStatus") == "ForDisapproval":
        selected.add(DETAIL_CHECKBOXES["recommend_for_disapproval"])
    else:
        selected.add(DETAIL_CHECKBOXES["recommend_for_approval"])

    return selected


def write_xlsx(template_path, output_path, cells, selected_ids):
    with zipfile.ZipFile(template_path, "r") as source:
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as target:
            for item in source.infolist():
                data = source.read(item.filename)
                if item.filename == "xl/worksheets/sheet1.xml":
                    data = patch_sheet(data, cells)
                elif item.filename == "xl/drawings/vmlDrawing1.vml":
                    data = patch_vml(data.decode("utf-8", errors="ignore"), selected_ids).encode("utf-8")
                target.writestr(item, data)


def patch_sheet(sheet_xml, cells):
    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    ET.register_namespace("", ns["main"])
    ET.register_namespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    ET.register_namespace("mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")
    ET.register_namespace("x14ac", "http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac")
    root = ET.fromstring(sheet_xml)
    sheet_data = root.find("main:sheetData", ns)
    if sheet_data is None:
        return sheet_xml
    for ref, value in cells.items():
        set_cell_inline_string(sheet_data, ref, value, ns)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


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


def patch_vml(vml, selected_ids):
    all_ids = set(LEAVE_CHECKBOXES.values()) | set(DETAIL_CHECKBOXES.values())

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


def main():
    if len(sys.argv) != 4:
        print("Usage: leave_form6_excel.py <input-json> <output-xlsx> <template-xlsx>", file=sys.stderr)
        return 2
    with open(sys.argv[1], "r", encoding="utf-8-sig") as handle:
        payload = json.load(handle)
    fill_sheet(payload, sys.argv[2], sys.argv[3])
    print(sys.argv[2])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
