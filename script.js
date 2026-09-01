const pdfInput = document.getElementById("pdfInput");
const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";


// PDF UPLOAD
if (pdfInput) {

    pdfInput.addEventListener("change", async function () {

        const file = this.files?.[0];

        if (!file) return;

        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            message.textContent = "❌ Please select a PDF file.";
            return;
        }

        fileName.textContent = "📄 " + file.name;
        message.textContent = "⏳ Reading your PDF...";

        try {

            if (typeof window.pdfjsLib === "undefined") {
                throw new Error("PDF.js is not loaded.");
            }

            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

            const arrayBuffer = await file.arrayBuffer();

            const pdf = await window.pdfjsLib
                .getDocument({ data: arrayBuffer })
                .promise;

            let fullText = "";

            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page = await pdf.getPage(pageNumber);

                const content = await page.getTextContent();

                const pageText = content.items
                    .map(item => item.str)
                    .join(" ");

                fullText += pageText + "\n";
            }

            extractedPDFText = fullText.trim();

            if (!extractedPDFText) {

                fileName.textContent = "⚠️ " + file.name;
                message.textContent =
                    "⚠️ This PDF has no readable text.";

                return;
            }

            fileName.textContent =
                "✅ " + file.name + " — Ready";

            message.textContent =
                "✅ PDF uploaded successfully!";

        } catch (error) {

            console.error("PDF ERROR:", error);

            extractedPDFText = "";

            fileName.textContent =
                "❌ " + file.name;

            message.textContent =
                "❌ Could not read this PDF.";
        }
    });
}


// GENERATE
if (generateBtn) {

    generateBtn.addEventListener("click", async function () {

        const manualText =
            userText?.value.trim() || "";

        const job =
            jobPosition?.value.trim() || "";

        const information =
            manualText || extractedPDFText;

        const documentType =
            document.querySelector(
                'input[name="document"]:checked'
            )?.value || "cv";


        if (!information) {

            message.textContent =
                "⚠️ Upload a PDF or enter your information.";

            return;
        }


        if (!job) {

            message.textContent =
                "⚠️ Please enter the target job.";

            return;
        }


        generateBtn.disabled = true;

        generateBtn.textContent = "⏳ Creating...";

        message.textContent =
            "🤖 AI is creating your German CV...";


        try {

            const response = await fetch(
                "/api/generate",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        information: information,
                        job: job,
                        document: documentType
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {
                throw new Error(
                    data?.error || "AI generation failed."
                );
            }


            if (!data?.result) {
                throw new Error(
                    "AI returned no result."
                );
            }


            showResult(data.result);

            createPDF(data.result, job);

            message.textContent =
                "✅ German CV created successfully!";


        } catch (error) {

            console.error(
                "GENERATION ERROR:",
                error
            );

            message.textContent =
                "❌ " + error.message;

        } finally {

            generateBtn.disabled = false;

            generateBtn.textContent =
                "✨ Generate Documents";
        }
    });
}


// SHOW RESULT
function showResult(text) {

    let resultBox =
        document.getElementById("resultBox");


    if (!resultBox) {

        resultBox =
            document.createElement("div");

        resultBox.id = "resultBox";

        resultBox.style.margin = "30px auto";
        resultBox.style.padding = "30px";
        resultBox.style.maxWidth = "900px";
        resultBox.style.background = "#ffffff";
        resultBox.style.border = "1px solid #e5e7eb";
        resultBox.style.borderRadius = "15px";
        resultBox.style.whiteSpace = "pre-wrap";
        resultBox.style.lineHeight = "1.7";

        document.body.appendChild(resultBox);
    }


    resultBox.textContent = text;
}


// CREATE PDF
function createPDF(text, job) {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        console.error("jsPDF is not loaded.");

        return;
    }


    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });


    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();

    const margin = 18;


    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);

    pdf.text(
        "LEBENSLAUF",
        margin,
        20
    );


    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text(
        "Position: " + job,
        margin,
        28
    );


    const lines =
        pdf.splitTextToSize(
            text,
            pageWidth - margin * 2
        );


    let y = 40;


    for (const line of lines) {

        if (y > pageHeight - 18) {

            pdf.addPage();

            y = 20;
        }

        pdf.text(
            line,
            margin,
            y
        );

        y += 5;
    }


    const safeJob =
        job
            .replace(
                /[^a-zA-Z0-9äöüÄÖÜß ]/g,
                ""
            )
            .trim()
            .replace(/\s+/g, "-");


    pdf.save(
        "German-CV-" +
        (safeJob || "Document") +
        ".pdf"
    );
}
```
