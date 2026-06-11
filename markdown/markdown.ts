export const powershellDoc = `
   POWERSHELL COMMAND DOCUMENTATION

1. GET A SINGLE FILE OR FOLDER PATH / LOCATION / METADATA

Get-ChildItem -Path "<absolute_root_Directory>" -Filter "<file/folder name>" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }

2. GET A SINGLE FILE CONTENT

Get-Content -Path "<absolute_file_path>\<filename>.<extension>" -Raw

3. LIST OUT DIRECTORY

Get-ChildItem -Path "<absolute_root_Directory>" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }

4. CREATE / OVERWRITE FILE

Set-Content -Path "<absolute_file_path>" -Value @"
<file content>
"@

`;
export const stdProjectTree = `
my-app/
│
├── node_modules/          # installed packages
├── public/                # static files
│   └── vite.svg
│
├── src/                   # main source code
│   │
│   ├── assets/            # images, fonts, icons
│   │   └── react.svg
│   │
│   ├── components/        # reusable UI components
│   │   └── Button.tsx
│   │
│   ├── pages/             # page-level components (for routing)
│   │   └── Home.tsx
│   │
│   ├── hooks/             # custom React hooks
│   │   └── useAuth.ts
│   │
│   ├── services/          # API calls / external logic
│   │   └── api.ts
│   │
│   ├── utils/             # helper functions
│   │   └── format.ts
│   │
│   ├── App.tsx            # main app component
│   ├── main.tsx           # entry point (ReactDOM render)
│   ├── index.css          # global styles
│   └── vite-env.d.ts
│
├── .gitignore
├── index.html             # root HTML
├── package.json
├── tsconfig.json          # (if using TypeScript)
├── vite.config.ts         # Vite config
└── README.md
`;
