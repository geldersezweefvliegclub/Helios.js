module.exports = {
    default: {
        paths: ['tests/**/*.feature'], // Path to feature files
        require: [
            'tests/step_definitions/**/*.ts',
        ], // Required modules
        requireModule: ['ts-node/register'], // Transpilation module
        format: [
            'summary',
            'progress-bar',
        ], // Output formats
    }
};
