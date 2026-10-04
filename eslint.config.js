// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
    {
        files: ["**/*.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...tseslint.configs.stylistic
        ],
        rules: {
            '@typescript-eslint/no-empty-object-type': 'warn',
            // een parameter met een "_" prefix mag ongebruikt zijn, zoals currentUser in nog lege heeftDataToegang<Endpoint>() functies
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}]
        }
    }
);
