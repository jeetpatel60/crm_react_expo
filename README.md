# CRM App

A modern CRM (Customer Relationship Management) mobile application built with React Native, Expo, and SQLite for local data storage.

## Features

- Modern 2025 UI/UX design language
- Local data storage with SQLite
- Contact management
- Task management
- Dashboard with analytics
- Dark/light mode support

## Tech Stack

- React Native
- Expo
- TypeScript
- SQLite (via expo-sqlite)
- React Navigation
- React Native Paper
- React Native Reanimated

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crm_react_expo.git
cd crm_react_expo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on a device or emulator:
- Press `i` to run on iOS simulator
- Press `a` to run on Android emulator
- Scan the QR code with the Expo Go app on your physical device

## Project Structure

```
crm_react_expo/
├── assets/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── constants/       # App constants and theme
│   ├── database/        # SQLite database setup and operations
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # App screens
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Native Paper](https://reactnativepaper.com/)
- [React Navigation](https://reactnavigation.org/)
