```javascript
const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";


// ==========================================
// PDF UPLOAD
// ==========================================

pdfInput.addEventListener("change", async function () {

    const file = this.files && this.files[0];

    if (!file) {
        return;
    }

    console.log("Selected file:", file.name);
    console.log("File type:", file.type);
    console.log("File size:", file.size);


    // Check PDF

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        message.textContent =
            "❌ Please select a PDF file.";

        return;
    }


    fileName.textContent =
        "📄 " + file.name;

    message.textContent =
        "⏳ Reading your PDF...";


    try {

        // Check PDF.js

        if (
            typeof window.pdfjsLib === "undefined"
        ) {

            throw new Error(
                "PDF.js is not loaded."
            );
        }


        // Set worker

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


        // Read file

        const arrayBuffer =
            await file.arrayBuffer();


        const pdf =
            await window.pdfjsLib
                .getDocument({
                    data: arrayBuffer
                })
                .promise;


        let fullText = "";


        // Read every page

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


        // No text

        if (!extractedPDFText) {

            message.textContent =
                "⚠️ This PDF has no readable text. It may be a scanned image.";

            fileName.textContent =
                "⚠️ " + file.name;

            return;
        }


        // SUCCESS

        fileName.textContent =
            "✅ " + file.name + " — Ready";

        message.textContent =
            "✅ PDF uploaded and read successfully!";


        console.log(
            "PDF TEXT:",
            extractedPDFText
        );


    } catch (error) {

        console.error(
            "PDF ERROR:",
            error
        );


        extractedPDFText = "";


        fileName.textContent =
            "❌ " + file.name;


        message.textContent =
            "❌ Could not read this PDF.";
    }
});


// ==========================================
// GENERATE DOCUMENT
// ==========================================

generateBtn.addEventListener(
    "click",
    async function () {

        const text =
            userText.value.trim();


        const job =
            jobPosition.value.trim();


        // PDF or manual text

        const finalInformation =
            text || extractedPDFText;


        // Document type

        const documentType =
            document.querySelector(
                'input[name="document"]:checked'
            )?.value || "cv";


        // ==================================
        // CHECK INFORMATION
        // ==================================

        if (!finalInformation) {

            message.textContent =
                "⚠️ Upload a PDF or enter your information.";

            return;
        }


        // ==================================
        // CHECK JOB
        // ==================================

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
                    "No result received from AI."
                );
            }


            // SHOW RESULT

            showResult(
                data.result
            );


            // PDF DOWNLOAD

            if (
                typeof createPDF ===
                "function"
            ) {

                createPDF(
                    data.result,
                    job
                );
            }


            message.textContent =
                "✅ German CV created successfully!";


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


// ==========================================
// SHOW RESULT
// ==========================================

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
            "white";


        resultBox.style.border =
            "1px solid #e5e7eb";


        resultBox.style.borderRadius =
            "15px";


        resultBox.style.whiteSpace =
            "pre-wrap";


        resultBox.style.lineHeight =
            "1.7";


        document
            .querySelector(".container")
            .appendChild(
                resultBox
            );
    }


    resultBox.textContent =
        text;
}


// ==========================================
// CREATE PDF
// ==========================================

function createPDF(text, job) {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        console.error(
            "jsPDF is not loaded."
        );

        return;
    }


    const {
        jsPDF
    } = window.jspdf;


    const pdf =
        new jsPDF({
            format: "a4",
            unit: "mm"
        });


    const pageWidth =
        pdf.internal.pageSize.getWidth();


    const pageHeight =
        pdf.internal.pageSize.getHeight();


    const margin = 18;


    const lines =
        pdf.splitTextToSize(
            text,
            pageWidth - margin * 2
        );


    pdf.setFontSize(18);

    pdf.setFont(
        "helvetica",
        "bold"
    );


    pdf.text(
        "LEBENSLAUF",
        margin,
        20
    );


    pdf.setFontSize(10);

    pdf.setFont(
        "helvetica",
        "normal"
    );


    pdf.text(
        "Position: " + job,
        margin,
        29
    );


    let y = 40;


    for (
        const line of lines
    ) {

        if (
            y > pageHeight - 15
        ) {

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
            .replace(
                /\s+/g,
                "-"
            );


    pdf.save(
        "German-CV-" +
        (
            safeJob ||
            "Document"
        ) +
        ".pdf"
    );
}
```
