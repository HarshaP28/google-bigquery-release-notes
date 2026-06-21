# BigQuery Release Notes Explorer

A modern, responsive, and highly aesthetic web application built with Python Flask and vanilla HTML, CSS, and JavaScript. The application fetches, parses, and formats the official Google Cloud BigQuery Release Notes RSS feed into an interactive, filterable developer dashboard.

## 🚀 Features

- **Automated RSS Feed Parsing**: Fetches the official Google Cloud BigQuery release XML feed dynamically and converts it to structured JSON payload data.
- **Granular Update Partitioning**: Automatically divides daily release note blocks into single, category-tagged updates (e.g., *Feature*, *Announcement*, *Issue*, *Deprecation*).
- **Interactive Metrics Dashboard**: Clickable metrics counters showing counts of updates per category, serving as interactive filters.
- **Instant Search**: Search through release note titles, updates content, and dates in real time.
- **Category Filter Chips**: Fast tabbed views to display specific types of updates.
- **Premium Styling & Layout**: Modern dark mode by default with timeline layout, entry hover highlights, and loading skeleton screen.
- **Sleek Light/Dark Theme Toggler**: Instantly switches design aesthetics, saving preferences locally via `localStorage`.
- **Manual Refresh with SVG Loader**: Pulls live changes on demand without needing to reload the entire web browser.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, Flask
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (HSL Variables, Grid, Flexbox, Transitions), Vanilla JavaScript (ES6)
- **External Feeds**: Google Cloud BigQuery RSS Feed

---

## 📦 Installation & Setup

Follow these steps to set up and run the application locally.

### 1. Initialize the Environment
Navigate to the project root directory and create a virtual environment to manage dependencies securely:

```bash
# Create the virtual environment
python -m venv .venv
```

### 2. Activate the Virtual Environment
Activate the environment based on your Operating System:

- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  .venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```

### 3. Install Dependencies
Install all required packages from `requirements.txt`:

```bash
pip install -r requirements.txt
```

---

## 🖥️ Running the Server

Start the local Flask development server:

```bash
python app.py
```

By default, the server will start in debug mode on port `5000`. Open your browser and navigate to:
**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

> [!NOTE]
> The Flask application parses the Atom feed in real-time from the Google Cloud Platform feeds. If you are offline or the GCP feeds are temporarily down, a user-friendly error screen with a manual retry button will be displayed.

---

## 📂 Project Structure

```text
bq-release-notes/
├── .gitignore            # Version control ignore rules
├── app.py                # Flask main application & feed parser logic
├── README.md             # Project documentation (this file)
├── requirements.txt      # Python dependencies list
├── static/
│   ├── script.js         # Frontend interactive logic (search, filter, count, render)
│   └── style.css         # Customized UI styling (HSL palettes, glassmorphism, responsive grid)
└── templates/
    └── index.html        # Main template dashboard structure
```
