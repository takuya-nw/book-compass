import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default eslintConfig;
