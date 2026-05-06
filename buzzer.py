import pygame
import numpy as np
import time
import threading

SAMPLE_RATE = 44100
ESCALATION_INTERVAL = 5
START_VOLUME = 0.08
VOLUME_STEP = 0.18
MAX_VOLUME = 1.0

dismissed = False


def make_tone(duration, volume):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Richer sound: mix three harmonics
    wave = (
        np.sin(2 * np.pi * 520 * t) * 0.5 +
        np.sin(2 * np.pi * 660 * t) * 0.3 +
        np.sin(2 * np.pi * 780 * t) * 0.2
    )
    # Fade in and out to remove clicking
    fade = int(SAMPLE_RATE * 0.02)
    wave[:fade] *= np.linspace(0, 1, fade)
    wave[-fade:] *= np.linspace(1, 0, fade)
    wave = (wave * 32767 * volume).astype(np.int16)
    stereo = np.column_stack((wave, wave))
    return pygame.sndarray.make_sound(stereo)


def alarm_loop():
    global dismissed
    volume = START_VOLUME

    while not dismissed:
        bar = "#" * int(volume * 20)
        print(f"Volume: {int(volume * 100):>3}%  [{bar:<20}]")

        # Beep pattern: 6 beeps per round, short gap between each
        for i in range(6):
            if dismissed:
                break
            beep = make_tone(0.35, volume)
            beep.play()
            time.sleep(0.42)
            beep.stop()

        volume = min(volume + VOLUME_STEP, MAX_VOLUME)
        if volume >= MAX_VOLUME:
            print("\n!! MAX VOLUME -- wake up NOW !!")

        # Short pause between rounds
        elapsed = 0
        while elapsed < ESCALATION_INTERVAL and not dismissed:
            time.sleep(0.1)
            elapsed += 0.1

    pygame.mixer.stop()
    print("\n\nAlarm dismissed! Good morning.")
    print("Snooze count logged. Tomorrow's alarm adjusts automatically.")


pygame.init()
pygame.mixer.init(frequency=SAMPLE_RATE, size=-16, channels=2, buffer=512)
screen = pygame.display.set_mode((420, 200))
pygame.display.set_caption("MorningMind Alarm")
font = pygame.font.SysFont(None, 36)
small = pygame.font.SysFont(None, 24)

print("=" * 40)
print("  MorningMind -- Exponential Alarm")
print("=" * 40)
print("Press SPACEBAR in the window to dismiss\n")

thread = threading.Thread(target=alarm_loop)
thread.start()

running = True
while running and not dismissed:
    screen.fill((20, 20, 22))
    txt = font.render("MorningMind Alarm", True, (240, 239, 232))
    sub = small.render("Press SPACEBAR to dismiss", True, (100, 100, 100))
    screen.blit(txt, (60, 70))
    screen.blit(sub, (100, 120))
    pygame.display.flip()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            dismissed = True
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                dismissed = True
                running = False

thread.join()
pygame.quit()
 