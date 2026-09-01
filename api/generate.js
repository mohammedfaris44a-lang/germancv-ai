```javascript
export default async function handler(req, res) {

    // Only POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            information,
            job,
            document
        } = req.body || {};


        // Check input
        if (!information || !job) {
            return res.status(400).json({
                error: "Information and job are required."
            });
        }


        // Check API key
        const apiKey =
            process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY is not configured in Vercel."
            });
        }


        // ==========================================
        // PROMPT
        // ==========================================

        const prompt = `
You are a professional German CV and job application writer.

Create a professional German job application based ONLY on the information provided by the user.

TARGET JOB:
${job}

USER INFORMATION:
${information}

REQUESTED DOCUMENT:
${
    document === "both"
        ? "German CV and German Cover Letter"
        : "German CV only"
}

IMPORTANT RULES:

- Write everything in professional German.
- Do NOT invent information.
- Do NOT invent qualifications.
- Do NOT invent work experience.
- Do NOT invent education.
- Do NOT invent dates.
- Do NOT invent companies.
- Do NOT invent skills.
- Keep all factual information accurate.
- Improve grammar and wording.
- Adapt the CV to the target job.
- Use a clean professional structure.
- If information is missing, simply omit it.
- Make the CV professional and concise.
- If a cover letter is requested, make it specific to the target job.
- Return plain text only.
- Do not use markdown code blocks.

Create the final document now.
`;


        // ==========================================
        // GEMINI API
        // ==========================================

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";


        const response =
            await fetch(url, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        apiKey

                },

                body: JSON.stringify({

                    contents: [

                        {
                            role: "user",

                            parts: [

                                {
                                    text: prompt
                                }

                            ]
                        }

                    ]

                })

            });


        const data =
            await response.json();


        // ==========================================
        // API ERROR
        // ==========================================

        if (!response.ok) {

            console.error(
                "Gemini API error:",
                data
            );

            return res.status(
                response.status
            ).json({

                error:
                    data?.error?.message ||
                    "Gemini API error."

            });
        }


        // ==========================================
        // GET AI RESULT
        // ==========================================

        const result =
            data
                ?.candidates?.[0]
                ?.content?.parts
                ?.map(
                    part => part.text || ""
                )
                .join("")
                .trim();


        if (!result) {

            console.error(
                "Gemini returned:",
                data
            );

            return res.status(500).json({

                error:
                    "Gemini returned no text."

            });
        }


        // ==========================================
        // SUCCESS
        // ==========================================

        return res.status(200).json({

            result: result

        });


    } catch (error) {

        console.error(
            "Server error:",
            error
        );

        return res.status(500).json({

            error:
                "Server error: " +
                error.message

        });
    }
}
```
