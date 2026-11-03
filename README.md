# Chore Chart

A simple chore chart for kids that lives on one iPad. Kids check off chores, earn points and streaks, spend points on rewards, and play Bubble Pop when their chores are done. Parents manage everything behind a 4-digit PIN.

Everything is saved on the device itself. There are no accounts, no servers and no tracking, so nothing about your family leaves the iPad.

## For families: how to install

1. Open the link to this app in **Safari** on the iPad.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open it from the new home screen icon. It runs full screen and works with no internet.
4. Follow the setup screen: add your kids' names and birthdays, then choose a 4-digit parent PIN.
5. **Write down the recovery code** it shows you. It is the only way to reset a forgotten PIN.

### Good to know
- **Back up now and then.** In Parents, then Settings, tap **Save a backup** and put the file in iCloud Drive or Files. If the iPad is replaced or Safari data is cleared, tap **Restore from a backup**.
- Data lives in that one iPad's browser. A second device starts with its own empty chart.
- Add the app to the Home Screen, because Safari can clear data from sites that are not used for a long time.

## For the owner: publishing with GitHub Pages

1. Put these files in a **public** GitHub repository (the files at the top level, not in a folder).
2. In the repository, open **Settings, then Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
4. After a minute the app is live at `https://<your-user>.github.io/<repo-name>/`. Send that link to friends.

To release an update, change the files and push. Devices pick up the new version the next time they open it with internet.

## What is in here

| File | Purpose |
| --- | --- |
| `index.html` | The whole app (chart, rewards, money, parent portal, setup) |
| `bubble.js` | The Bubble Pop game |
| `sw.js` | Lets the app open offline |
| `manifest.webmanifest`, `icon-*.png` | Home Screen icon and name |

No build step and no dependencies. It is plain HTML and JavaScript. The only outside request is the Google Fonts stylesheet, and the app falls back to system fonts without it.

## Daily puzzles
Three new puzzles each day (Word Guess, Group Up, Word Trail) open once a kid has finished all of today's chores. No unlocking, no play-time clock, one try a day each.
