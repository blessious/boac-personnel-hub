import sys
import json
import socket

def ping_device(ip, port):
    try:
        # Create socket with short timeout
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)  # 5 second timeout
        
        # Try to connect to the port
        result = sock.connect_ex((ip, int(port)))
        sock.close()
        
        # If result is 0, port is open
        if result == 0:
            return {"online": True}
        else:
            return {"online": False, "error": f"Port closed (error {result})"}
            
    except socket.timeout:
        return {"online": False, "error": "Connection timeout"}
    except Exception as e:
        return {"online": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"online": False, "error": "Invalid arguments. Usage: python check_biometric.py <ip> <port>"}))
        sys.exit(1)
    
    ip = sys.argv[1]
    port = sys.argv[2]
    result = ping_device(ip, port)
    print(json.dumps(result))
