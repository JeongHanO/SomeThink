module.exports = {
    "/user/signup/register": {
        post: {
            summary: "user_signup",
            requestBody: {
                description: "Optional description in *Markdown*",
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                username: { type: "string" },
                                password: { type: "string" },
                                email: { type: "string" },
                            },
                            required: ["username", "password", "email"],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "OK",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
