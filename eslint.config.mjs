import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/components/ui/InteractiveTable.tsx",
      "src/components/ui/TablePrimitives.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXOpeningElement[name.name="table"]',
          message:
            "Use the public InteractiveTable component for all tabular UI. Raw table markup is reserved for its internal primitives.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/TablePrimitives"],
              message:
                "Table primitives are private implementation details. Import InteractiveTable from @/components/ui instead.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated widget bundle
    "public/widget*.js",
  ]),
]);

export default eslintConfig;
