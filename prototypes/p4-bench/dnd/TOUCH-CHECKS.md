# P4 touch checks (O-5)

Run on each touch device (iPhone, iPad). Start the server with `node prototypes/p4-bench/serve.mjs --lan`, then open the "on your network" address it prints, followed by `/dnd/`, on the device. The three engines are the links at the top of the page: **Pointer Events**, **Native DnD** and **Pragmatic DnD**.

Each check is run once per engine. Record pass or fail and anything odd (delays, a system preview, a menu popping up).

| #   | Do                                                                                   | Expect                                                                             |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 1   | Swipe up or down quickly, starting on an event                                       | The week scrolls; no drag starts                                                   |
| 2   | Press and hold an event without moving, about half a second                          | A drag starts. No text selection, no copy/share menu, no link preview              |
| 3   | Keep holding, then drag to another day and time; let go                              | A dashed preview snaps to slots as you move; the event lands where the preview was |
| 4   | Start a drag and hold your finger near the bottom edge of the week                   | The week scrolls by itself                                                         |
| 5   | Drag the bottom edge of an event (the last few pixels) down                          | The event gets longer                                                              |
| 6   | Drag "Lunch" out of the week onto the dashed box on the right (or below, on a phone) | The box says "Received: Lunch". Pointer Events can't do this: expect nothing       |
| 7   | Start a drag, then let go somewhere outside the week and the box                     | Nothing moves                                                                      |

Also note which engine felt best for moving events, and whether the native engines' system "lift" preview was helpful or in the way.
