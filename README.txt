One Flip Away website

Open this folder in Visual Studio Code and launch index.html with Live Server.
All image files are in assets/.
The website now contains 16 panels; displayed Panel 11 has been removed.
The WE DID IT burst was removed from the celebration panel.

Interactive version (v02)
- Open the brochure, ask Layla for help, and close the brochure to advance.
- Show all panels bypasses the story pauses; Restart story returns to the beginning.
- Documentation and screenshots are in documentation/.
- Numbered project archives are saved in the sibling comm-lab-project-2-versions folder.

Browser verification
Requires Node.js, Playwright, and installed Microsoft Edge.
Run: node documentation/verify-story.cjs
If Playwright is outside normal Node module resolution, set PLAYWRIGHT_MODULE to its module directory first.
The check starts its own temporary server on 127.0.0.1:4174 and saves screenshots.
