# Admin Panel User Guide

## 🎯 Overview

The Admin Panel is a **code-free** interface for managing events, map highlights, and content. No technical knowledge required!

## 🚀 Accessing the Admin Panel

1. Open your browser and go to: **http://localhost:3000/admin**
2. You'll see a dashboard with all existing events

## 📝 Creating a New Event

1. Click the **"Create New Event"** button (top right)
2. Fill in the **Basic Information** tab:
   - **Event ID**: Use lowercase with hyphens (e.g., `cold-war`)
   - **Title**: The display name (e.g., "The Cold War")
   - **Date**: Human-readable format (e.g., "1947-1991")
   - **Summary**: Brief 1-2 sentence summary
   - **Description**: Medium description (1 paragraph)
   - **Full Description**: Complete description (multiple paragraphs)
   - Use the rich text editor for formatting (bold, italic, lists)

## 🗺️ Setting Up Map Highlights

1. Click the **"Map Highlights"** tab
2. **Click on countries** in the interactive map to highlight them
3. Or **manually add countries** using the "Add Country" button
4. **Unified Areas**: Create blocs/alliances (e.g., "NATO & Western Allies")
   - Click "Add Area"
   - Enter area name
   - List countries (comma-separated)
5. **Connections**: Add relationships between actors
   - Click "Add Connection"
   - Select "From" and "To" countries
   - Choose connection type (alliance, rivalry, etc.)

## ⏱️ Building the Timeline

1. Click the **"Timeline"** tab
2. Fill in the form to add a new timeline point:
   - **Point ID**: Unique identifier
   - **Label/Title**: Event name
   - **Date**: Human-readable date
   - **Year**: Year as string
   - **Event Type**: Military, Diplomatic, Economic, etc.
   - **Position**: 0-100 (for timeline placement)
   - **Description**: Rich text description
   - **Is Turning Point**: Check if this is a major event
3. Click **"Add Timeline Point"**
4. Edit or delete points using the buttons on each point

## 🧠 Adding Theory Interpretations

1. Click the **"Theory Analysis"** tab
2. Select a theory from the dropdown
3. Click **"Add Theory"**
4. Fill in:
   - **Interpretation**: How this theory views the event (rich text)
   - **Key Points**: Add bullet points (click "Add Point")
   - **Limitations**: Set if theory can explain event and weakness level
5. Click the chevron to expand/collapse each theory

## 💾 Saving Your Work

1. Click the **"Save Event"** button (top right)
2. The system will:
   - First try to save to the database (if API is available)
   - Fall back to browser storage if API is unavailable
3. You'll see a success message when saved

## ✏️ Editing Existing Events

1. From the dashboard, click **"Edit"** on any event card
2. Make your changes in any tab
3. Click **"Save Event"** when done

## 🎨 Tips & Best Practices

### Map Highlights
- Click directly on countries in the map for fastest selection
- Use the country search for exact country names
- Countries must match exactly (e.g., "United States of America" not "USA")

### Timeline Points
- Position 0 = start of timeline
- Position 100 = end of timeline
- Distribute points evenly for best visual effect

### Rich Text Editor
- Use **Bold** for emphasis
- Use **Lists** for key points
- Keep descriptions clear and concise

### Theory Interpretations
- Each theory should have a unique perspective
- Key points should be 3-5 bullet points
- Be honest about limitations - it makes the analysis stronger

## 🔍 Previewing Events

1. Click the **eye icon** on any event card
2. This opens the event in a new tab
3. You can see how it looks to users

## ❓ Troubleshooting

**"Event not saving"**
- Check that all required fields are filled (ID, Title, Description, Full Description)
- Check browser console for errors
- Try refreshing the page

**"Map not loading"**
- Check that `/geo/countries.geojson` file exists
- Check browser console for errors

**"Countries not highlighting"**
- Make sure country names match exactly (case-sensitive)
- Check the country list in the dropdown for correct spelling

## 🎯 Next Steps

Once you've created events:
1. They'll appear in the main application
2. Users can select them from the sidebar
3. Map highlights will show automatically
4. Timeline points will be navigable

---

**Remember**: This is a visual, code-free interface. Everything is point-and-click!
