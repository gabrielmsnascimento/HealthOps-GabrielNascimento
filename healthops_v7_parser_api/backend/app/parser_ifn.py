from __future__ import annotations

import re
from datetime import datetime, timedelta, date
from typing import Any, Dict, List, Optional, Tuple

import pdfplumber

MONTHS = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
}
OFF_CODES = {"DO", "DR", "VC", "OFF"}
PROGRAM_CODES = ("HSB", "HSBE", "ASB", "CRM", "CRMB", "CRMBSB", "CBF", "EMER", "MCK")


def _clean(value: Any) -> str:
    return str(value or "").replace("\n", " ").strip()


def parse_roster_date(value: Any) -> Optional[date]:
    text = _clean(value)
    m = re.search(r"(\d{2})-([A-Za-z]{3})-(\d{4})", text)
    if not m:
        return None
    return datetime(int(m.group(3)), MONTHS[m.group(2)], int(m.group(1))).date()


def parse_pairing_date(value: Any) -> Optional[date]:
    text = _clean(value).replace(" ", "")
    m = re.search(r"/(\d{2})(\d{2})(\d{2})/", text)
    if not m:
        return None
    dd, mm, yy = map(int, m.groups())
    return datetime(2000 + yy, mm, dd).date()


def parse_time_token(value: Any) -> Optional[Tuple[str, int]]:
    text = _clean(value)
    m = re.search(r"(\d{1,2}:\d{2})(?:\(\+(\d+)\))?", text)
    if not m:
        return None
    return m.group(1), int(m.group(2) or 0)


def resolve_datetime(base_date: Optional[date], value: Any) -> Optional[datetime]:
    token = parse_time_token(value)
    if not base_date or not token:
        return None
    hhmm, offset = token
    hh, mm = map(int, hhmm.split(":"))
    return datetime.combine(base_date, datetime.min.time()) + timedelta(days=offset, hours=hh, minutes=mm)


def split_airport_time(value: Any) -> Tuple[Optional[str], Optional[str]]:
    text = _clean(value)
    m = re.search(r"\b([A-Z]{3})\s*(\d{1,2}:\d{2}(?:\(\+\d+\))?)", text)
    if not m:
        return None, None
    return m.group(1), m.group(2)


def fmt_dt(value: Optional[datetime]) -> Optional[str]:
    return value.strftime("%Y-%m-%dT%H:%M") if value else None


def hours_between(start: Optional[datetime], end: Optional[datetime]) -> float:
    if not start or not end:
        return 0.0
    return round((end - start).total_seconds() / 3600, 2)


def classify_doc(text: str) -> str:
    if "Roster Report" in text:
        return "ifn_roster"
    if "Demonstrativo Escala Planejada" in text:
        return "comparativo_latam"
    if "TIPO DIÁRIA" in text or "TIPO DIARIA" in text:
        return "diarias_latam"
    return "unknown"


def extract_tables(path: str) -> Tuple[List[List[Any]], Dict[str, Any]]:
    rows: List[List[Any]] = []
    pages_info: List[Dict[str, Any]] = []
    full_text_parts: List[str] = []

    with pdfplumber.open(path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            full_text_parts.append(text)
            tables = page.extract_tables()
            pages_info.append({"page": page_number, "tables": len(tables), "width": page.width, "height": page.height})
            for table in tables:
                for row in table:
                    if row and any(_clean(cell) for cell in row):
                        rows.append(row)

    text = "\n".join(full_text_parts)
    meta = {
        "document_type": classify_doc(text),
        "pages": pages_info,
        "row_count": len(rows),
    }
    return rows, meta


def normalize_roster_rows(table_rows: List[List[Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    current_date: Optional[date] = None
    current_pairing: Optional[str] = None
    current_base: Optional[date] = None

    for row in table_rows:
        if len(row) < 12:
            continue
        row_text = " ".join(_clean(x) for x in row)
        if "Roster Report" in row_text or ("Date" in row_text and "Pairing" in row_text):
            continue

        row_date = parse_roster_date(row[0])
        if row_date:
            current_date = row_date

        pairing = _clean(row[2])
        if pairing:
            current_pairing = pairing
            current_base = parse_pairing_date(pairing) or current_date

        base_date = current_date or current_base
        report = _clean(row[4])
        activity = _clean(row[5]).replace(" ", "")
        condition = _clean(row[7])
        if len(row) >= 21:
            dep_cell, arr_cell, release_cell = row[10], row[11], row[13]
        else:
            dep_cell, arr_cell, release_cell = row[9], row[10], row[11]
        origin, departure = split_airport_time(dep_cell)
        destination, arrival = split_airport_time(arr_cell)
        release = _clean(release_cell)

        if not any([row_date, pairing, report, activity, origin, destination, release]):
            continue

        normalized.append({
            "source_date": current_date.isoformat() if current_date else None,
            "pairing": current_pairing,
            "pairing_start_date": base_date.isoformat() if base_date else None,
            "report_raw": report or None,
            "activity": activity or None,
            "condition": condition or None,
            "origin": origin,
            "departure_raw": departure,
            "destination": destination,
            "arrival_raw": arrival,
            "release_raw": release or None,
            "row_preview": row_text[:220],
        })

    return normalized




def push_forward(dt: Optional[datetime], after: Optional[datetime]) -> Optional[datetime]:
    if dt is None or after is None:
        return dt
    while dt < after:
        dt += timedelta(days=1)
    return dt

def _is_flight(activity: Optional[str]) -> bool:
    return bool(activity and re.match(r"^LA\d+", activity))


def _is_program(activity: Optional[str], pairing: Optional[str]) -> bool:
    value = (activity or pairing or "").upper()
    return value.startswith(PROGRAM_CODES) or bool(re.match(r"^R\d+", value))


def build_journeys(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    journeys: List[Dict[str, Any]] = []
    current: Optional[Dict[str, Any]] = None
    last_event_dt: Optional[datetime] = None

    for row in rows:
        activity = row.get("activity")
        pairing = row.get("pairing")
        pairing_code = (pairing or "").upper()
        activity_code = (activity or pairing or "").upper()
        if activity_code in OFF_CODES or pairing_code in OFF_CODES:
            current = None
            last_event_dt = None
            continue

        if not (_is_flight(activity) or _is_program(activity, pairing)):
            continue

        base = datetime.fromisoformat(row["pairing_start_date"]).date() if row.get("pairing_start_date") else None
        report_dt = resolve_datetime(base, row.get("report_raw"))
        dep_dt = resolve_datetime(base, row.get("departure_raw"))
        arr_dt = resolve_datetime(base, row.get("arrival_raw"))
        release_dt = resolve_datetime(base, row.get("release_raw"))

        starts_new_journey = bool(report_dt) or current is None
        if starts_new_journey:
            current = {
                "date": report_dt.date().isoformat() if report_dt else (row.get("source_date") or row.get("pairing_start_date")),
                "pairing": pairing,
                "type": "voo" if _is_flight(activity) else "programacao",
                "report": fmt_dt(report_dt),
                "release": None,
                "duty_hours": 0.0,
                "flight_hours": 0.0,
                "flights": [],
                "activities": [],
                "warnings": [],
            }
            journeys.append(current)
            last_event_dt = report_dt

        # Some executed PDFs omit (+1) on continuation rows. Keep events monotonic inside a journey.
        dep_dt = push_forward(dep_dt, last_event_dt)
        arr_dt = push_forward(arr_dt, dep_dt or last_event_dt)
        release_dt = push_forward(release_dt, arr_dt or dep_dt or last_event_dt)

        if _is_flight(activity):
            flight = {
                "number": activity,
                "condition": row.get("condition"),
                "origin": row.get("origin"),
                "departure": fmt_dt(dep_dt),
                "destination": row.get("destination"),
                "arrival": fmt_dt(arr_dt),
            }
            current["flights"].append(flight)
            if dep_dt and arr_dt:
                current["flight_hours"] = round(current["flight_hours"] + hours_between(dep_dt, arr_dt), 2)
            if activity.startswith("LA8"):
                current["international"] = True
        else:
            current["activities"].append({
                "code": activity,
                "origin": row.get("origin"),
                "start": fmt_dt(dep_dt),
                "end": fmt_dt(arr_dt),
            })

        last_event_dt = release_dt or arr_dt or dep_dt or last_event_dt

        if release_dt:
            current["release"] = fmt_dt(release_dt)
            if current.get("report"):
                current["duty_hours"] = hours_between(datetime.fromisoformat(current["report"]), release_dt)

    for journey in journeys:
        if not journey.get("release") and journey.get("flights"):
            last_arrival = journey["flights"][-1].get("arrival")
            if last_arrival:
                last_dt = datetime.fromisoformat(last_arrival)
                post = 45 if journey.get("international") else 30
                release_dt = last_dt + timedelta(minutes=post)
                journey["release"] = fmt_dt(release_dt)
                journey["warnings"].append(f"Fim de jornada estimado: corte + {post} min")
                if journey.get("report"):
                    journey["duty_hours"] = hours_between(datetime.fromisoformat(journey["report"]), release_dt)
        if not journey.get("report"):
            journey["warnings"].append("Apresentação não identificada na linha normalizada")

    return journeys

def parse_ifn_pdf(path: str) -> Dict[str, Any]:
    table_rows, meta = extract_tables(path)
    normalized = normalize_roster_rows(table_rows)
    journeys = build_journeys(normalized)
    return {
        "meta": meta,
        "normalized_rows_count": len(normalized),
        "journeys_count": len(journeys),
        "journeys": journeys,
        "normalized_rows_sample": normalized[:30],
    }
