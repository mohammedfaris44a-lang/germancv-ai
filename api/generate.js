export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { information, job, document } = req.body;

        if (!information || !job) {
            return res.status(400).json({
                error: "Information and job are required."
            });
        }

        const prompt = `
You are a professional German CV writer.

Create a professional German job application based ONLY on the information provided by the user.

Target job:
${job}

User information:
${information}

Requested document:
${document === "both" ? "German CV and German Cover Letter" : "German CV only"}

Rules:
- Write everything in professional German.
- Do not invent qualifications, jobs, dates, companies, education or skills.
- Improve grammar and professional wording.
- Adapt the CV to the target job.
- Keep factual information accurate.
- Use a clean professional structure.
- If information is missing, simply omit it.
- For the cover letter, make it concise and specific to the target job.

Return the result as plain text.
`;

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },

                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert German CV and cover letter writer."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.4
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data);

            return res.status(response.status).json({
                error: data.error?.message || "OpenAI API error."
            });
        }

        const result =
            data.choices?.[0]?.message?.content;

        if (!result) {
            return res.status(500).json({
                error: "No result returned from AI."
            });
        }

        return res.status(200).json({
            result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Server error."
        });
    }
}
