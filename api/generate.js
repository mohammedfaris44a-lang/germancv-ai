```javascript
export default async function handler(req, res) {

    // =========================
    // METHOD CHECK
    // =========================

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }


    try {

        // =========================
        // GET DATA
        // =========================

        const {
            information,
            job,
            document
        } = req.body || {};


        if (!information || !job) {
            return res.status(400).json({
                error: "Information and job are required."
            });
        }


        // =========================
        // API KEY
        // =========================

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY is missing in Vercel."
            });
        }


        // =========================
        // PROMPT
        // =========================

        const prompt = `
You are a professional German CV writer.

Create a professional German job application.

TARGET JOB:
${job}

USER INFORMATION:
${information}

DOCUMENT REQUEST:
${
    document === "both"
        ? "Create a German CV AND a German cover letter."
        : "Create a German CV only."
}

RULES:
- Write in professional German.
- Use ONLY information supplied by the user.
- Never invent experience.
- Never invent education.
- Never invent companies.
- Never invent dates.
- Never invent qualifications.
- Never invent skills.
- Improve grammar and professional wording.
- Adapt the CV to the target job.
- Keep all facts accurate.
- If information is missing, omit it.
- Return plain text.
- Do not return JSON.
- Do not use code blocks.

Create the final document now.
`;


        // =========================
        // GEMINI REQUEST
        // =========================

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";


        const response =
            await fetch(url, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
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


        // =========================
        // READ RESPONSE
        // =========================

        const data =
            await response.json();


        console.log(
            "Gemini status:",
            response.status
        );


        console.log(
            "Gemini response:",
            JSON.stringify(data)
        );


        // =========================
        // GEMINI ERROR
        // =========================

        if (!response.ok) {

            return res.status(500).json({

                error:
                    "Gemini API Error: " +
                    (
                        data?.error?.message ||
                        "Unknown Gemini error"
                    )

            });
        }


        // =========================
        // GET TEXT
        // =========================

        let result = "";


        if (
            data?.candidates &&
            data.candidates.length > 0
        ) {

            const parts =
                data.candidates[0]?.content?.parts || [];


            result =
                parts
                    .map(
                        part => part?.text || ""
                    )
                    .join("")
                    .trim();
        }


        // =========================
        // EMPTY RESULT
        // =========================

        if (!result) {

            return res.status(500).json({

                error:
                    "Gemini returned an empty response."

            });
        }


        // =========================
        // SUCCESS
        // =========================

        return res.status(200).json({

            result: result

        });


    } catch (error) {

        console.error(
            "SERVER ERROR:",
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
