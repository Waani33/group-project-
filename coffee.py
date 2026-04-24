import serial
import time

arduino = serial.Serial('COM3', 9600, timeout=1)
time.sleep(2)  # let Arduino reset

arduino.write(b'PRESS\n')

response = arduino.readline().decode().strip()
print(response)

arduino.close()
