import datetime as dt
import json
import sys

import zk


def parse_date(value):
    if not value:
        return None
    return dt.datetime.strptime(value, "%Y-%m-%d").date()


def try_connect(ip_address, port, force_udp, timeout, ommit_ping):
    """Attempt a ZK connection with the given parameters. Returns (connection, device) or raises."""
    device = zk.ZK(
        ip_address,
        port=int(port or 4370),
        timeout=timeout,
        password=0,
        force_udp=force_udp,
        ommit_ping=ommit_ping,
    )
    conn = device.connect()
    return conn, device


def fetch_attendance(ip_address, port, start_date=None, end_date=None):
    start = parse_date(start_date)
    end = parse_date(end_date)
    port = int(port or 4370)

    # Strategy: try multiple connection modes so we work across all network types.
    # Remote/NAT'd devices often only respond over UDP; local devices prefer TCP.
    # We also retry with ommit_ping toggled because some device firmware versions
    # require the initial ping while others reject it.
    strategies = [
        # (force_udp, timeout_seconds, ommit_ping)
        (False, 10, False),   # TCP, with ping  — standard local network
        (False, 10, True),    # TCP, skip ping  — some firmware variants
        (True,  15, False),   # UDP, with ping  — remote / NAT'd / routed networks
        (True,  15, True),    # UDP, skip ping  — remote devices that reject ping
    ]

    last_error = None
    for force_udp, timeout, ommit_ping in strategies:
        proto = "UDP" if force_udp else "TCP"
        ping  = "no-ping" if ommit_ping else "ping"
        print(f"Trying {proto}/{ping} timeout={timeout}s ...", file=sys.stderr)
        connection = None
        try:
            connection, _ = try_connect(ip_address, port, force_udp, timeout, ommit_ping)
            print(f"Connected via {proto}/{ping}", file=sys.stderr)
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
        except Exception as exc:
            print(f"  {proto}/{ping} failed: {exc}", file=sys.stderr)
            last_error = exc
        finally:
            try:
                if connection:
                    connection.disconnect()
            except Exception:
                pass

    raise RuntimeError(
        f"Could not connect to biometric device at {ip_address}:{port} "
        f"after trying all connection modes. Last error: {last_error}"
    )


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
