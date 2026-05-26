# Frame Export Plugin: Usage Guide

## What This Plugin Does

The Frame Export plugin reads your FigJam Frame board and packages everything into a structured Excel file. That Excel file is designed to be uploaded directly into Copilot along with your Business Problem Statement from the previous workshop. Copilot then runs through five prompts in sequence, generating a set of deliverables and packaging them into a zip file.

## Before You Start

Make sure your FigJam board follows the expected naming conventions. The plugin looks for specific section names to find the right data:

**Role sections** should be named `Role 1`, `Role 2`, `Role 3`, etc. Inside each role, the plugin looks for these child sections:

- `Name` (one sticky with the agreed-upon role name)
- `Objective` (stickies for each objective)
- `Pain Points` (stickies for each pain point)
- `Tools` (stickies for each tool)

`Notes` sections inside roles are ignored. Those are for the facilitator.

**Context sections** should exist as their own named areas on the board:

- `General Description`
- `External Complexifiers`
- `Starting Hypotheses`
- `Data Details`

The plugin only reads sticky notes. Any plain text on the board (like instructional labels or helper text) is ignored automatically.

## Running the Plugin

1. Open your Frame board in FigJam.
2. Launch the plugin from the Plugins menu.
3. Click **Parse Board**.
4. The plugin will scan the board and show you a summary of what it found: how many roles, objectives, pain points, tools, and context entries.
5. Expand any section in the preview to verify the data looks right.
6. If something is missing, check your board naming and run Parse Board again.
7. When everything looks good, click **Export to Excel**.
8. A file called `frame_export.xlsx` will download to your machine.

## What's in the Excel File

The workbook has six sheets:

| Sheet | What's on it |
|-------|-------------|
| Master Prompt | Instructions for Copilot explaining the workbook structure and the order to run everything |
| P1 - Role Profiles | Prompt 1 + all board data (role names, objectives, pain points, tools, context) |
| P2 - Human Problem | Prompt 2 + all board data |
| P3 - Biz Problem Update | Prompt 3 (uses outputs from the first two prompts and the uploaded Business Problem Statement) |
| P4 - Solution Hypotheses | Prompt 4 (uses outputs from prompts 1 through 3) |
| P5 - Solutions & DVF | Prompt 5 (uses outputs from all prior prompts) |

Sheets 1 and 2 include the actual data from the board. Sheets 3 through 5 rely on Copilot having the earlier outputs in its conversation context.

## Uploading to Copilot

1. Open a new Copilot conversation.
2. Upload the `frame_export.xlsx` file.
3. Also upload the Business Problem Statement document from the previous workshop.
4. Tell Copilot to read the Master Prompt sheet and begin.
5. Copilot will work through all five prompts in order.
6. At the end, it will compile the five outputs into a zip file for download.

## Troubleshooting

**The plugin shows 0 for a section.** Double check that the section name on the board matches what the plugin expects. For example, the pain points section inside a role needs to be called `Pain Points`, not something like `Pains` or `Key Pain Points`.

**A role shows up but has no data.** The child sections (Name, Objective, Pain Points, Tools) need to be inside the Role container, not sitting next to it as siblings. Make sure they are nested within the `Role 1` frame, not floating outside it.

**Stickies aren't being captured.** The plugin only reads sticky notes. If you typed directly on the board as a text element instead of using a sticky, it won't be picked up. Convert those to stickies.

**Copilot skips a prompt or gives a short answer.** The master prompt has strict instructions to prevent this, but if Copilot still cuts corners, remind it to re-read the Master Prompt sheet and follow all the rules listed there.
