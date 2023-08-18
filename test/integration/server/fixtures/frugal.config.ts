import { Config } from "../../../../mod.ts";
import { importKey } from "../../../../src/server/crypto.ts";
import { MemorySessionStorage } from "../../../../src/server/session/MemorySessionStorage.ts";

export const config: Config = {
    self: import.meta.url,
    pages: [
        "./dynamicPage.ts",
        "./staticPage.ts",
        "./staticPageJIT.ts",
    ],
    log: { level: "silent" },
    server: {
        cryptoKey: await importKey(
            "eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
        ),
        session: {
            storage: new MemorySessionStorage(),
        },
    },
    cleanAll: false,
};
