# Feature Plan: Host Cities & Venues Guide

## 1. Objective
Users attending or following the FIFA 2026 World Cup will want to know where the matches are played. Since the tournament is spread across 3 countries and 16 cities, a dedicated "Venues" guide is essential.

## 2. UI/UX Design
- A new route `/venues`.
- A hero section introducing the Host Cities.
- A grid of cards displaying the 16 venues.
- Each card will show:
  - City Name
  - Stadium Name
  - Capacity
  - Host Country Flag (🇨🇦, 🇲🇽, or 🇺🇸)
- A clean, modern look consistent with the existing design system (using CSS grid and current color variables).

## 3. Data & Backend
- No external backend is needed.
- We will add a `VENUES` array to `src/worldCupData.js`.
- The data will cover the 16 host cities: Vancouver, Toronto, Mexico City, Guadalajara, Monterrey, Atlanta, Boston, Dallas, Houston, Kansas City, Los Angeles, Miami, New York/New Jersey, Philadelphia, San Francisco Bay Area, Seattle.

## 4. Implementation Steps
1. **Data**: Add `VENUES` to `worldCupData.js`.
2. **Component**: Create `VenuesPage` component in `src/main.jsx`.
3. **Routing**: Add `/venues` handling in `App` component in `src/main.jsx`.
4. **Navigation**: Add "VENUES" link to the `Header` and `Landing` page navs.
5. **Styling**: Add CSS for `.venues-page`, `.venue-grid`, and `.venue-card` in `src/style.css`.

## 5. Testing & Microplans
- Run the build using `npm run build` to verify compilation.
- If there are errors, make a microplan to fix them, test again, and commit.
