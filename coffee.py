import pygame
import numpy as np
import time
import threading

SAMPLE_RATE = 44100
BREW_MINUTES = 1
BREW_SECONDS = 10

dismissed = False
brewing_done = False


def make_tone(freq, duration, volume):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    wave = (
        np.sin(2 * np.pi * freq * t) * 0.6 +
        np.sin(2 * np.pi * freq * 2 * t) * 0.25 +
        np.sin(2 * np.pi * freq * 0.5 * t) * 0.15
    )
    fade = int(SAMPLE_RATE * 0.08)
    wave[:fade] *= np.linspace(0, 1, fade)
    wave[-fade:] *= np.linspace(1, 0, fade)
    wave = (wave * 32767 * volume).astype(np.int16)
    stereo = np.column_stack((wave, wave))
    return pygame.sndarray.make_sound(stereo)


def play_jingle():
    # Soft, warm, slow — like a gentle good morning chime
    notes = [
        (392, 0.5),
        (440, 0.5),
        (523, 0.5),
        (440, 0.4),
        (523, 0.6),
        (659, 1.0),
        (523, 0.5),
        (659, 1.2),
    ]
    for freq, duration in notes:
        tone = make_tone(freq, duration, 0.45)
        tone.play()
        time.sleep(duration + 0.12)
        tone.stop()


def brew_loop():
    global brewing_done
    remaining = BREW_SECONDS

    print("=" * 40)
    print("  MorningMind -- Coffee Brew Timer")
    print("=" * 40)
    print(f"Brewing starts now. Ready in {BREW_MINUTES} minute(s).\n")

    while remaining > 0 and not dismissed:
        mins = remaining // 60
        secs = remaining % 60
        bar = "#" * int(((BREW_SECONDS - remaining) / BREW_SECONDS) * 20)
        print(f"  Time left: {mins:02d}:{secs:02d}  [{bar:<20}]", end="\r")
        time.sleep(1)
        remaining -= 1

    if not dismissed:
        print("\n\nCoffee is ready! Enjoy your morning.")
        brewing_done = True
        play_jingle()


pygame.init()
pygame.mixer.init(frequency=SAMPLE_RATE, size=-16, channels=2, buffer=512)
screen = pygame.display.set_mode((420, 220))
pygame.display.set_caption("MorningMind Coffee Timer")
font = pygame.font.SysFont(None, 36)
small = pygame.font.SysFont(None, 24)
big = pygame.font.SysFont(None, 52)

thread = threading.Thread(target=brew_loop)
thread.start()

start_time = time.time()

running = True
while running:
    elapsed = time.time() - start_time
    remaining = max(0, BREW_SECONDS - int(elapsed))
    mins = remaining // 60
    secs = remaining % 60
    progress = min((elapsed / BREW_SECONDS), 1.0)

    screen.fill((20, 20, 22))

    if brewing_done:
        msg = font.render("Coffee is ready!", True, (93, 202, 165))
        sub = small.render("Enjoy your morning.", True, (100, 100, 100))
        screen.blit(msg, (90, 80))
        screen.blit(sub, (140, 125))
    else:
        title = font.render("Coffee brewing...", True, (240, 239, 232))
        timer = big.render(f"{mins:02d}:{secs:02d}", True, (240, 175, 75))
        sub = small.render("Scheduled by MorningMind", True, (100, 100, 100))
        bar_w = int(360 * progress)
        pygame.draw.rect(screen, (40, 40, 44),
                         (30, 155, 360, 10), border_radius=5)
        pygame.draw.rect(screen, (93, 202, 165),
                         (30, 155, bar_w, 10), border_radius=5)
        screen.blit(title, (100, 40))
        screen.blit(timer, (155, 85))
        screen.blit(sub, (120, 175))

    pygame.display.flip()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            dismissed = True
            running = False

    if brewing_done and not thread.is_alive():
        time.sleep(3)
        running = False

    time.sleep(0.05)

thread.join()
pygame.quit()
