export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { information, job, document } = req.body || {};

        if (!information || !job) {
            return res.status(400).json({
                error: "Information and job are required."
            });
        }

        const prompt = `
You are a professional German CV and cover letter writer.

Create a professional German job application based ONLY on the information provided by the user.

Target job:
${job}

User information:
${information}

Requested document:
${document === "both"
    ? "German CV and German Cover Letter"
    : "German CV only"}

Rules:
- Write everything in professional German.
- Do not invent qualifications, experience, education, dates, companies or skills.
- Improve grammar and professional wording.
- Adapt the CV to the target job.
- Keep all factual information accurate.
- Use a clean professional structure.
- If information is missing, omit it.
- Make the cover letter concise and specific to the target job.

Return the final documents as plain text.
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
            process.env.GEMINI_API_KEY,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Gemini API error."
            });
        }

        const result =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!result) {
            return res.status(500).json({
                error: "Gemini returned no text."
            });
        }

        return res.status(200).json({
            result
        });

    } catch (error) {

        console.error("Server error:", error);

        return res.status(500).json({
            error: "Server error: " + error.message
        });
    }
}
