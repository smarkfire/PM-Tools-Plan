# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PLAN-Tools** (项目计划管理软件) is a frontend-only project management application built with Vue 3. It manages project information and creates project plans with Gantt chart visualization, without any backend dependencies.

**Current Status**: Active development - core features implemented including task management, Gantt chart visualization, and import/export functionality.

## Technology Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite 5.2
- **State Management**: Pinia (3 stores: project, tasks, ui)
- **UI Library**: Element Plus + Tailwind CSS
- **Internationalization**: Vue I18n (English and Chinese support)
- **Gantt Chart**: dhtmlx-gantt
- **Excel Operations**: xlsx
- **Date Handling**: dayjs
- **Icons**: Font Awesome (free) + Element Plus icons
- **Drag & Drop**: Sortable.js (for task list reordering)
- **Code Quality**: ESLint + Prettier
- **Testing**: Vitest (unit), Cypress (E2E), Manual (tests/test-iframe.html)

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test:unit    # Run unit tests with Vitest
npm run test:e2e     # Run E2E tests with Cypress

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
```

## Architecture

### Directory Structure
```
src/
├── components/
│   ├── ProjectInfo/      # Project information management
│   │   ├── ProjectInfoForm.vue
│   │   └── MemberManager.vue
│   ├── ProjectPlan/      # Task list and operations
│   │   ├── Toolbar.vue
│   │   ├── TaskList.vue
│   │   ├── TaskForm.vue
│   │   ├── DisplaySettingsDialog.vue
│   │   └── GanttColumnSettingsDialog.vue
│   ├── GanttChart/       # Gantt chart visualization
│   │   └── GanttChart.vue
│   └── common/           # Shared components
│       └── LanguageSwitcher.vue
├── views/
│   ├── ProjectInfoView.vue
│   └── ProjectPlanView.vue
├── locales/              # Internationalization
│   ├── en.json           # English translations
│   ├── zh-CN.json        # Chinese translations
│   └── index.js          # i18n configuration
├── store/
│   ├── project.js        # Project info & members state
│   ├── tasks.js          # Tasks, WBS, display settings state
│   └── ui.js             # UI state (split pane, language)
├── router/
│   └── index.js          # Vue Router config
├── utils/
│   ├── export.js         # Export functionality (JSON, Excel, Markdown, CSV)
│   ├── import.js         # Import functionality
│   ├── wbs.js            # WBS numbering & task tree utilities
│   ├── date.js           # Date utilities (working days, duration calc)
│   ├── tasks.js          # Task-specific utilities
│   └── mockHelper.js     # Mock data helpers
├── data/
│   ├── mock.js           # Basic mock data
│   └── mock-enhanced.js  # Enhanced mock data
├── assets/
│   └── main.css          # Global styles
├── App.vue               # Root component
└── main.js               # Entry point
```

### Store Architecture (Pinia)

**Three key stores** manage all state:

1. **useProjectStore** (`store/project.js`):
   - Project basic info (id, name, dates, description)
   - Project members (CRUD operations)
   - localStorage persistence with key `plan-tools-project`
   - JSON import/export

2. **useTasksStore** (`store/tasks.js`):
   - Task tree with nested children
   - Display settings (which columns to show)
   - Expanded/collapsed state for each task
   - WBS auto-generation on save
   - Task operations: add, update, delete, reorder, change hierarchy level
   - localStorage persistence with key `plan-tools-tasks`

3. **useUIStore** (`store/ui.js`):
   - Split pane ratio (0.2-0.8 range, default 0.4)
   - Dragging state for split pane
   - Current locale/language setting
   - Auto-save settings
   - localStorage persistence with key `plan-tools-ui`

**Key pattern**: All stores automatically save to localStorage on state changes, ensuring data persists across sessions.

### Data Persistence
- **localStorage**: Primary data storage (all data persists locally)
- **No Backend**: This is a pure frontend application
- **Auto-save**: Changes automatically save to prevent data loss
- **Four localStorage keys**: `plan-tools-project`, `plan-tools-tasks`, `plan-tools-ui`, `plan-tools-locale`

### Data Flow
- **Unidirectional**: Pinia ensures predictable state management
- **Real-time updates**: Task operations automatically update Gantt chart and WBS numbering
- **Split pane synchronization**: Left pane (task list) and right pane (Gantt) stay in sync

## Key Features

### 0. Internationalization (i18n)
- Multi-language support: English and Chinese
- Language switcher in navigation bar
- Persistent language preference across sessions
- All UI elements, forms, dialogs, and messages translated
- Export files (Excel, Markdown, CSV) respect selected language
- Real-time language switching without page refresh

### 1. Project Information Management
- Basic info: name, start/end dates, description
- Member management: name, phone, email, role
- Import/Export: JSON and Excel formats

### 2. Project Plan Management
- Hierarchical task structure with parent/child relationships
- WBS numbering (auto-generated on save)
- Task operations: add, edit, delete, reorder (within same level), adjust hierarchy
- Task properties: name, dates, duration, deliverable, dependencies, assignee, priority, status
- Priority levels: High/Medium/Low
- Status: Todo/In Progress/Completed

### 3. Gantt Chart
- Visual task timeline with dhtmlx-gantt
- Drag-and-drop for scheduling
- Dependency arrows
- Export to PNG

### 4. Import/Export Formats
- **JSON**: Full data exchange
- **Excel**: Spreadsheet compatibility
- **Markdown**: Documentation format
- **CSV**: Task data export
- **PNG**: Gantt chart images

## Data Structures

### Project Info
```javascript
{
  id: String,
  name: String,
  startDate: String,
  endDate: String,
  description: String,
  members: [{
    id: String,
    name: String,
    phone: String,
    email: String,
    role: String
  }]
}
```

### Task
```javascript
{
  id: String,
  wbs: String,          // Auto-generated
  name: String,
  startDate: String,
  endDate: String,
  duration: Number,     // days
  deliverable: String,
  dependencies: [String],
  assignee: String,     // Selected from project members
  priority: String,     // 高/中/低
  status: String,       // 待办/进行中/已完成
  description: String,
  parentId: String,
  children: [Object]
}
```

## UI/UX Guidelines

### Color Scheme (defined in tailwind.config.js)
- Primary: #4285F4 (Blue) - use as `text-primary` or `bg-primary`
- Success: #34A853 (Green) - use as `text-success`
- Warning: #FBBC05 (Yellow) - use as `text-warning`
- Danger: #EA4335 (Red) - use as `text-danger`
- Background: #F8F9FA - use as `bg-bg-base`
- Text: #333333 (primary), #666666 (secondary) - use as `text-text-primary`, `text-text-secondary`

### Layout Structure
- **Two main views**: Project Info (项目信息管理) and Project Plan (项目计划管理)
- **Project Plan view split pane**: Task list (left, resizable) and Gantt chart (right)
- **Resizable divider**: Drag the divider between panes (constrained to 20%-80% ratio)
- **Element Plus components**: Use for dialogs, forms, buttons, tables, uploads
- **Tailwind utilities**: Use for spacing, colors, flexbox layout (e.g., `text-4xl`, `mb-4`, `flex`)

## Important Implementation Notes

1. **Internationalization (i18n)**:
   - Configured in `src/locales/index.js` with Vue I18n
   - Two locales: English (en, default) and Chinese (zh-CN)
   - Locale preference stored in `plan-tools-locale` localStorage key
   - Use `useUIStore().setLocale(locale)` to change language programmatically
   - Export functions use custom `t()` helper in `utils/export.js` for translated exports
   - All Element Plus components must register i18n for translated UI

2. **WBS Numbering**: Auto-generated by calling `generateAndSaveWBS()` after task structure changes
   - Implemented in `utils/wbs.js` with recursive tree traversal
   - Format: 1, 1.1, 1.2, 2, 2.1, etc.
   - **MAX_WBS_DEPTH = 4**: Task hierarchy limited to 4 levels (store/tasks.js:8)

3. **Task Ordering**: Use `reorderTasks(taskId, direction)` where direction is 'up' or 'down'
   - Only reorders within the same hierarchy level (siblings)
   - Uses `findParentAndIndex()` to locate task position

4. **Task Hierarchy**: Use `changeTaskLevel(taskId, direction)` where direction is 'in' or 'out'
   - 'in': Makes task a child of previous sibling
   - 'out': Makes task a sibling of its parent
   - Automatically regenerates WBS after hierarchy change

5. **Assignee Selection**: Must be selected from project members list
   - Use `projectStore.memberOptions` for select dropdown options
   - Format: `{ label: member.name, value: member.id }`

6. **Display Settings**: Users can toggle which task fields are visible in the list
   - Stored in `tasksStore.displaySettings`
   - Format: `{ showWBS: true, showName: true, showStartDate: true, ... }`
   - Use `tasksStore.visibleColumns` getter for filtered column list

7. **Gantt Chart Integration**:
   - Uses `dhtmlx-gantt` library with Chinese localization
   - Task data must be converted from nested tree to flat format
   - Column configuration defined in `GanttChart.vue`
   - Supports PNG export (requires html2canvas fallback for unlicensed versions)

8. **Date Calculations**:
   - Use `utils/date.js` for all date operations
   - Working days exclude weekends (Saturday/Sunday)
   - Duration calculation uses `calculateDuration(startDate, endDate)`
   - End date calculation uses `calculateEndDate(startDate, duration)`

9. **File Upload/Import**:
   - Supports JSON, Excel (.xlsx), and Markdown formats
   - Use Element Plus `<el-upload>` component with `drag` mode
   - Validation happens in `utils/import.js`

10. **Export Internationalization**:
   - All export formats (Excel, Markdown, CSV) respect current locale
   - Use `getCurrentLocale()` from `@/locales` to get current language
   - Priority/status values stored in Chinese, translated at export time
   - Custom `t()` function in export.js handles translation key lookup

## Code Style & Configuration

### ESLint (`.eslintrc.js`)
- Extends: `eslint:recommended` and `plugin:vue/vue3-recommended`
- Rules: `vue/multi-word-component-names: 'off'`, `no-unused-vars: 'warn'`
- Run: `npm run lint` (auto-fixes issues)

### Prettier (`.prettierrc`)
- No semicolons, single quotes, 2 spaces, trailing commas (ES5)
- Print width: 100 characters
- Run: `npm run format`

### Testing Approach
- **Manual Testing**: Open `tests/test-iframe.html` in browser for quick utility function tests
- **Unit Tests**: Vitest for component and utility testing (`npm run test:unit`)
- **E2E Tests**: Cypress for full user flow testing (`npm run test:e2e`)
- See `tests/TESTING.md` for detailed testing guide

### Vite Config
- Development server port: 5173, auto-opens browser
- Path alias: `@` maps to `src/`
- Build output: `dist/` directory

### Router Configuration
- Two routes: `/project-info` (default), `/project-plan`
- Route guards set document title dynamically

## Common Development Patterns

### Adding a New Task Property
1. Update data structure in `CLAUDE.md` and technical specs
2. Add to `TaskForm.vue` form fields
3. Add to `tasks.js` store's `addTask()` action
4. Update display settings in tasks store if user should be able to toggle visibility
5. Add to Gantt chart columns if needed for visualization

### Modifying Gantt Chart Columns
Edit `GanttChart.vue` `configureGantt()` function:
```javascript
gantt.config.columns = [
  {
    name: 'customField',
    label: 'Custom Label',
    width: 100,
    template: function(obj) {
      return obj.customField || ''
    }
  }
]
```
Also update `gantt.config.grid_width` to sum of all column widths.

### Working with Task Trees
- Use `flattenTasks(tasks)` to get flat array from nested structure
- Use `findTask(tasks, taskId)` to locate task by ID in tree
- Use `buildTaskTree(flatTasks)` to convert flat array to nested tree
- Use `getTaskDepth(task, allTasks)` to get hierarchy level

### Adding a New Import/Export Format
1. Add handler in `utils/import.js` or `utils/export.js`
2. Update file type acceptance in upload components (accept attribute)
3. Add format option to export dropdown/buttons
4. If adding translations, update both `src/locales/en.json` and `src/locales/zh-CN.json`
5. Test with sample files

### Adding Internationalization for New Features
1. Add translation keys to both locale files (`src/locales/en.json`, `src/locales/zh-CN.json`)
2. Use `$t('key.path')` in templates or `t('key.path')` in setup script with `useI18n()`
3. For exports, use the `t()` helper from `utils/export.js` which respects current locale
4. Element Plus components: `this.$t()` works automatically in templates

## Known Limitations & Considerations

1. **dhtmlx-gantt licensing**: ExportToPNG requires paid license; falls back to html2canvas
2. **Large datasets**: No virtual scrolling implemented yet; performance may degrade with 1000+ tasks
3. **Concurrent editing**: No real-time collaboration; single-user application
4. **Browser storage**: localStorage has ~5MB limit; large projects may hit quota
5. **Mobile responsiveness**: Split pane stacks vertically on mobile (not fully optimized)
6. **WBS depth limit**: Maximum 4 levels of task hierarchy (enforced in store/tasks.js)
7. **Priority/Status storage**: These values are stored in Chinese (高/中/低, 待办/进行中/已完成) regardless of UI language
