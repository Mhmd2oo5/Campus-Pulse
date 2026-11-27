# Frontend review

Reviewed locally on November 22, 2026 using the in-app Chromium browser and Node.js 24. No backend services were present in the repository.

## Automated checks

`npm run test:frontend`: 10 tests passed. JavaScript syntax checks and `git diff --check` passed.

HTTP smoke checks passed for all 16 pages/assets, JavaScript module content types, and the missing-file 404 response.

## Browser checks

| Scenario | Result |
| --- | --- |
| Initial directory | 12 sample resources, three in each category |
| Search `LIBRARY` plus Study areas | Two matching resources; filters retained after reload |
| Search with no matches | Clear empty state; reset restores all 12 resources |
| Name sort | Collaboration Corner appears first |
| Resource details | Correct description, features, unknown condition, unprovided capacity/hours |
| Keyboard dismissal | Escape closes details and restores the opener's focus |
| Save and reload | Bookmark retained and saved view shows the resource |
| Remove final saved resource | Helpful empty saved state appears |
| Printer + Design Building | No compatible samples; clear empty state |
| Printer + Engineering Building | Engineering Print Point shown; printer-specific preferences |
| Mobile menu | Opens, closes after navigation; exposes expanded state |
| Responsive breakpoints | Single column at 320/390px; two columns at 640/768px; three columns at 1024/1440px; no horizontal overflow |
| Recommendation details | Saving and closing restores focus within recommendation results |
| Images and console | No broken images or browser console errors observed |
| Invalid login | Missing-field and incorrect-credential messages retained |
| Signup validation | Short username and short password rejected |
| Account round trip | Signup, greeting, logout, valid login, and logout work with local demo data |

## Limits

- Sample locations and features need replacement with verified campus records.
- No live API, database, secure authentication, report submission, votes, freshness calculations, or ranked recommendations were available to test.
- Recommendation preference controls are an interface preview. Unknown conditions do not receive a favorable score.
- The retained account prototype stores demo credentials locally; server authentication is a separate backend requirement.
- Browser tests used Chromium; Safari and Firefox have not been checked.
