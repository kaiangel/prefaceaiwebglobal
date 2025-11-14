# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `npm run dev`: Run development server
- `npm run build`: Build the project for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint for code linting

## Code Style Guidelines
- **Framework**: Next.js with React functional components
- **Styling**: Tailwind CSS + CSS modules (*.module.css)
- **Imports**: Group imports by type (React, Next.js, components, contexts, styles)
- **Naming**: 
  - Components: PascalCase (e.g., Navbar.jsx)
  - Hooks & functions: camelCase (e.g., useAuth, handleInputChange)
  - Files: kebab-case for utility files, PascalCase for components
- **Error Handling**: Use try/catch blocks with console.error() and user-friendly alerts
- **State Management**: React Context (AuthContext) for global state
- **API Calls**: Use fetch API with async/await syntax