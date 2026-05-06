import serial
import time

ARDUINO_PORT = "COM3"
BAUD_RATE = 9600


def press_coffee_button():
    arduino = serial.Serial(ARDUINO_PORT, BAUD_RATE)
    time.sleep(2)

    arduino.write(b"PRESS\n")

    arduino.close()
    print("Coffee maker activated.")