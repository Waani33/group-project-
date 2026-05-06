#include <Servo.h>

Servo coffeeServo;

int servoPin = 9;

void setup() {
  Serial.begin(9600);
  coffeeServo.attach(servoPin);

  coffeeServo.write(0);   // starting position
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    if (command == 'B') {
      coffeeServo.write(90);   // press button
      delay(1000);

      coffeeServo.write(0);    // release button
      delay(1000);
    }
  }
}