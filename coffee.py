import serial
import time

ARDUINO_PORT = "COM3"
BAUD_RATE = 9600

def press_coffee_button():
    arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=2)
    time.sleep(2)

    arduino.write(b"PRESS\n")
    print("Sent PRESS to Arduino")

    arduino.close()