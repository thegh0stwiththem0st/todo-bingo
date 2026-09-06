import type { FillerTask } from "../types";

const fillerGroups: Record<string, string[]> = {
  "Movement / Reset": [
    "Drink a glass of water",
    "Stretch for 1 minute",
    "Stand up and move around",
    "Take 5 deep breaths",
    "Step outside for 2 minutes",
    "Rest your eyes for 1 minute",
  ],
  "Tiny Cleaning Wins": [
    "Put away 5 things",
    "Clear one small surface",
    "Throw away 3 pieces of trash",
    "Tidy one small area for 2 minutes",
  ],
  "Digital Cleanup": [
    "Close unused browser tabs",
    "Clear 5 notifications",
    "Reply to one message",
    "Delete 5 unnecessary files or emails",
  ],
  "Productivity Boosts": [
    "Work on one task for 5 minutes",
    "Break one big task into 3 smaller steps",
    "Write down the next step for something you've been avoiding",
    "Set a 5-minute timer and start",
    "Choose the single most important thing to do next",
  ],
  "Fun / Wellness": [
    "Play one favorite song",
    "Make a cup of tea or coffee",
    "Look away from the screen and stretch your shoulders",
    "Give yourself credit for one thing you've already finished today",
  ],
};

export const defaultFillerTasks: FillerTask[] = Object.entries(fillerGroups).flatMap(
  ([category, tasks]) =>
    tasks.map((text, index) => ({
      id: `filler-${category.toLowerCase().replace(/[^a-z]+/g, "-")}-${index}`,
      text,
      enabled: true,
      builtIn: true,
      category,
    })),
);
