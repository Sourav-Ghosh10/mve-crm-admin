export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/mocks/fileMock.ts",
        "\\.(mp4|webm)$": "<rootDir>/src/mocks/fileMock.ts",
        "^../../lib/utils$": "<rootDir>/src/lib/utils.ts",
        "^@/(.*)$": "<rootDir>/src/$1",
        "^firebase/app$": "<rootDir>/src/mocks/firebaseMock.ts",
        "^firebase/auth$": "<rootDir>/src/mocks/firebaseMock.ts",
        ".*utils/env$": "<rootDir>/src/mocks/env.ts",
        ".*config/firebase$": "<rootDir>/src/mocks/firebaseConfigMock.ts"
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: 'tsconfig.jest.json',

            isolatedModules: true,
        }]
    },

    transformIgnorePatterns: [
        "node_modules/(?!(@firebase|firebase|lucide-react)/)"
    ],
};
