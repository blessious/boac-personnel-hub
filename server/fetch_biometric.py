import datetime as dt
import json
import sys

import zk


def parse_date(value):
    if not value:
        return None
    return dt.datetime.strptime(value, "%Y-%m-%d").date()


def fetch_attendance(ip_address, port, start_date=None, end_date=None):
    start = parse_date(start_date)
    end = parse_date(end_date)
    device = zk.ZK(
        ip_address,
        port=int(port or 4370),
        timeout=5000,
        password=0,
        force_udp=False,
        ommit_ping=False,
    )
    connection = None
    try:
        connection = device.connect()
        attendances = connection.get_attendance()
        rows = []
        for attendance in attendances:
            timestamp = attendance.timestamp
            if start and timestamp.date() < start:
                continue
            if end and timestamp.date() > end:
                continue
            rows.append(
                {
                    "user_id": str(attendance.user_id),
                    "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    "date": timestamp.strftime("%Y-%m-%d"),
                    "time": timestamp.strftime("%H:%M:%S"),
                }
            )
        return rows
    finally:
        if connection:
            connection.disconnect()


def main():
    if len(sys.argv) < 3:
        print("Usage: fetch_biometric.py <ip_address> <port> [start_date] [end_date]", file=sys.stderr)
        return 2
    rows = fetch_attendance(
        sys.argv[1],
        sys.argv[2],
        sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None,
        sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else None,
    )
    print(json.dumps(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
