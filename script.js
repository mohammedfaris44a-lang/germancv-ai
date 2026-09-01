```javascript
const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";


// ========================================
// PDF.JS WORKER
// ========================================

if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}


// ========================================
// READ UPLOADED PDF
// ========================================

pdfInput.addEventListener("change", async function () {

    if (!this.files || !this.files.length) {
        return;
    }

    const file = this.files[0];

    if (file.type !== "application/pdf") {

        message.textContent =
            "❌ Please select a PDF file.";

        return;
    }

    fileName.textContent =
        "📄 Reading: " + file.name;

    message.textContent =
        "⏳ Reading your PDF...";

    try {

        const arrayBuffer =
            await file.arrayBuffer();

        if (typeof pdfjsLib === "undefined") {

            throw new Error(
                "PDF.js is not loaded."
            );
        }

        const pdf =
            await pdfjsLib.getDocument({
                data: arrayBuffer
            }).promise;

        let fullText = "";


        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(pageNumber);

            const content =
                await page.getTextContent();

            const pageText =
                content.items
                    .map(item => item.str)
                    .join(" ");

            fullText +=
                pageText + "\n";
        }


        extractedPDFText =
            fullText.trim();


        if (!extractedPDFText) {

            message.textContent =
                "⚠️ No readable text found in this PDF.";

            return;
        }


        fileName.textContent =
            "✅ " + file.name + " — Ready";

        message.textContent =
            "✅ PDF read successfully!";

    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ Could not read this PDF.";
    }
});


// ========================================
// GENERATE DOCUMENT
// ========================================

generateBtn.addEventListener(
    "click",
    async function () {

        const text =
            userText.value.trim();

        const job =
            jobPosition.value.trim();

        const finalInformation =
            text || extractedPDFText;

        const documentType =
            document.querySelector(
                'input[name="document"]:checked'
            )?.value || "cv";


        // CHECK INFORMATION

        if (!finalInformation) {

            message.textContent =
                "⚠️ Upload a PDF or enter your information.";

            return;
        }


        // CHECK JOB

        if (!job) {

            message.textContent =
                "⚠️ Please enter the target job.";

            return;
        }


        generateBtn.disabled = true;

        generateBtn.textContent =
            "⏳ Creating...";

        message.textContent =
            "🤖 AI is creating your German CV...";


        try {

            const response =
                await fetch(
                    "/api/generate",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            information:
                                finalInformation,

                            job:
                                job,

                            document:
                                documentType
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "AI generation failed."
                );
            }


            if (!data.result) {

                throw new Error(
                    "AI returned no result."
                );
            }


            // SHOW RESULT

            showResult(
                data.result
            );


            // CREATE PDF

            createPDF(
                data.result,
                job
            );


            message.textContent =
                "✅ CV generated and PDF downloaded!";


        } catch (error) {

            console.error(error);

            message.textContent =
                "❌ " + error.message;

        } finally {

            generateBtn.disabled = false;

            generateBtn.textContent =
                "✨ Generate Documents";
        }
    }
);


// ========================================
// SHOW AI RESULT
// ========================================

function showResult(text) {

    let resultBox =
        document.getElementById(
            "resultBox"
        );


    if (!resultBox) {

        resultBox =
            document.createElement("div");

        resultBox.id =
            "resultBox";

        resultBox.style.marginTop =
            "30px";

        resultBox.style.padding =
            "25px";

        resultBox.style.background =
            "#ffffff";

        resultBox.style.border =
            "1px solid #e5e7eb";

        resultBox.style.borderRadius =
            "15px";

        resultBox.style.whiteSpace =
            "pre-wrap";

        resultBox.style.lineHeight =
            "1.7";

        resultBox.style.fontSize =
            "14px";

        document
            .querySelector(".container")
            .appendChild(resultBox);
    }


    resultBox.textContent =
        text;
}


// ========================================
// CREATE PDF
// ========================================

function createPDF(text, job) {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        throw new Error(
            "PDF generator is not loaded."
        );
    }


    const {
        jsPDF
    } = window.jspdf;


    const pdf =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });


    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();


    const margin = 18;

    const usableWidth =
        pageWidth - margin * 2;


    // ====================================
    // TITLE
    // ====================================

    pdf.setFont(
        "helvetica",
        "bold"
    );

    pdf.setFontSize(20);

    pdf.text(
        "LEBENSLAUF",
        margin,
        22
    );


    // ====================================
    // JOB
    // ====================================

    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(10);

    pdf.text(
        "Position: " + job,
        margin,
        31
    );


    // ====================================
    // LINE
    // ====================================

    pdf.line(
        margin,
        36,
        pageWidth - margin,
        36
    );


    // ====================================
    // TEXT
    // ====================================

    pdf.setFontSize(10);

    const lines =
        pdf.splitTextToSize(
            cleanText(text),
            usableWidth
        );


    let y = 46;


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        if (
            y >
            pageHeight - 18
        ) {

            pdf.addPage();

            y = 20;
        }


        pdf.text(
            lines[i],
            margin,
            y
        );


        y += 5.2;
    }


    // ====================================
    // FILE NAME
    // ====================================

    const safeJob =
        job
            .replace(
                /[^a-zA-Z0-9äöüÄÖÜß ]/g,
                ""
            )
            .trim()
            .replace(
                /\s+/g,
                "-"
            );


    const fileName =
        "German-CV-" +
        (
            safeJob ||
            "Document"
        ) +
        ".pdf";


    // ====================================
    // DOWNLOAD
    // ====================================

    pdf.save(fileName);
}


// ========================================
// CLEAN TEXT FOR PDF
// ========================================

function cleanText(text) {

    return text
        .replace(/\r/g, "")
        .replace(/\t/g, "    ")
        .replace(/[•●]/g, "-")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .trim();
}
```
