# Connecting the order form to Google Sheets

Every order from the website will appear as a new row in a Google Sheet,
in addition to the email the bakery already gets. Takes about 5 minutes.
Do this while signed in to the Google account that should own the sheet
(the bakery Gmail is a good choice).

## 1. Make the sheet

1. Go to [sheets.new](https://sheets.new) to create a blank sheet.
2. Name it something like **little loaf orders**.

## 2. Add the script

1. In the sheet, open **Extensions → Apps Script**.
2. Delete everything in the code box.
3. Paste in the entire contents of `Code.gs` (in this folder).
4. Click the **save** icon (💾).

## 3. Publish it as a web app

1. Click **Deploy → New deployment**.
2. Click the ⚙️ gear next to "Select type" and choose **Web app**.
3. Set:
   - **Description:** website orders
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google asks you to authorize. Click **Authorize access**, pick your account.
   If you see "Google hasn't verified this app", click **Advanced → Go to
   (project name) (unsafe)**. That warning appears because you wrote the script
   yourself; it only lets the script add rows to this one sheet.
6. Copy the **Web app URL** (it starts with `https://script.google.com/macros/s/` and ends in `/exec`).

## 4. Send the URL

Paste the web app URL into the chat, and it gets added to the site
(it goes into `SHEETS_URL` at the top of the order form section of `script.js`).

## What the sheet looks like

An **Orders** tab is created automatically on the first order, with these columns:

received · name · contact · loaves · estimated total · pickup date · notes ·
classic sourdough · cinnamon raisin · jalapeño cheddar · custom · status

The four flavor columns count how many of each loaf are in that order, so you
can add them up to see what to bake. The **status** column starts as "new";
change it to "confirmed", "baked", "picked up", whatever helps.

## If you change the script later

Use **Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy**.
That keeps the same URL. Making a *new* deployment gives a new URL, which
would need to be swapped into the site.
