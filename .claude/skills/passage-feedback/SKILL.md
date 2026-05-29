---
name: passage-feedback
description: Collect feedback and save it as a titled, formatted Notion page under Passage > Feedback.
trigger: /passage-feedback
---

# /passage-feedback

Collect feedback notes and save them as a new formatted page under the **Passage Feedback** Notion page.

**Parent page ID:** `36f2aaf7-c73f-81e5-8c20-ef8e19c08858`

## Step 1 — Ask for feedback

Open with:

> What notes do you want to make?
> _(You can press Fn twice to activate macOS Dictation, then Return when done speaking)_

Collect items one at a time until the user says "done", "that's it", "finish", or similar. Number them as they come in so the user can see the list building up.

## Step 2 — Format the feedback

For each raw item, extract:
- A short **title** (3–6 words capturing the main topic)
- A concise **description** (the core point, cleaned up)

Format each item as a titled bullet: `- **Title**: Description`

Also generate an overall **page title** that captures the subject matter (e.g. "Email Editor Improvements", "Onboarding Flow Notes"). Append today's date: `Subject — MMM D, YYYY`.

## Step 3 — Preview

Show the user what the Notion page will look like:

> Here's how it'll look in Notion:
>
> **[Generated page title]**
>
> - **[Title 1]**: [Description 1]
> - **[Title 2]**: [Description 2]
> ...
>
> **Save to Notion?** (yes / edit / cancel)

If they say **edit**, ask which number to change and what the new text should be. Re-show the preview and confirm again.

If they say **cancel**, stop — do not create any Notion page.

## Step 4 — Create the Notion page

Call `mcp__claude_ai_Notion__notion-create-pages` with:
- **parent:** `{"type": "page_id", "page_id": "36f2aaf7-c73f-81e5-8c20-ef8e19c08858"}`
- **icon:** `💬`
- **properties title:** the generated page title
- **content:** the titled bullet points in Notion Markdown

Example content format:
```
- **Personal/Family Toggle**: Tag layout is junky, needs a cleaner design
- **Email Preview**: Looks janky, needs polish
- **Side Panel Size**: Increase the size of the side panel
```

## Step 5 — Confirm to user

After the page is created, tell the user:

> Saved! View it here: [page URL returned by Notion]

---

## Notes

- If the user provides zero feedback items, don't create a page. Tell them: "Nothing to save — let me know when you have feedback."
- The parent page ID (`36f2aaf7-c73f-81e5-8c20-ef8e19c08858`) is the **Feedback** page inside **Passage Operating System**. Do not change it.
- Titles should be concise and descriptive — avoid generic titles like "Feedback Item 1".
- The overall page title should reflect the subject matter, not just the date.
- Never ask about voice control — just mention Fn twice in the opening prompt.
