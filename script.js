```javascript
const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";


// ========================================
// LOAD jsPDF
// ========================================

function loadJsPDF() {
    return new Promise((resolve, reject) => {

        if (window.jspdf && window.jspdf.jsPDF) {
            resolve(window.jspdf.jsPDF);
            return;
        }

        const script = document.createElement("script");

        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

        script.onload = () => {
            if (window.jspdf && window.jspdf.jsPDF) {
                resolve(window.jspdf.jsPDF);
            } else {
                reject(new Error("jsPDF could not be loaded."));
            }
        };

        script.onerror = () => {
            reject(new Error("Could not load PDF generator."));
        };

        document.head.appendChild(script);
    });
}


// ========================================
// PDF UPLOAD
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
            throw new Error("PDF.js is not loaded.");
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

            fullText += pageText + "\n";
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

        extractedPDFText = "";

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

        const documentType =
            document.querySelector(
                'input[name="document"]:checked'
            )?.value || "cv";

        const finalInformation =
            text.length > 0
                ? text
                : extractedPDFText;


        // --------------------------------
        // CHECK INFORMATION
        // --------------------------------

        if (!finalInformation) {

            message.textContent =
                "⚠️ Upload a PDF or enter your information.";

            return;
        }


        // --------------------------------
        // CHECK JOB
        // --------------------------------

        if (!job) {

            message.textContent =
                "⚠️ Please enter the target job.";

            jobPosition.focus();

            return;
        }


        // --------------------------------
        // START
        // --------------------------------

        generateBtn.disabled = true;

        generateBtn.textContent =
            "⏳ Creating PDF...";

        message.textContent =
            "🤖 AI is creating your German CV...";


        try {

            // Make sure PDF generator is ready
            await loadJsPDF();


            // --------------------------------
            // CALL OUR VERCEL API
            // --------------------------------

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
                    "AI returned an empty result."
                );
            }


            // --------------------------------
            // SHOW RESULT
            // --------------------------------

            displayResult(data.result);


            // --------------------------------
            // CREATE PDF
            // --------------------------------

            createPDF(
                data.result,
                job,
                documentType
            );


            message.textContent =
                "✅ Your PDF is ready!";


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
// DISPLAY RESULT
// ========================================

function displayResult(result) {

    let resultBox =
        document.getElementById("resultBox");


    if (!resultBox) {

        resultBox =
            document.createElement("div");

        resultBox.id =
            "resultBox";

        resultBox.style.marginTop =
            "25px";

        resultBox.style.padding =
            "20px";

        resultBox.style.background =
            "#f8fafc";

        resultBox.style.border =
            "1px solid #e5e7eb";

        resultBox.style.borderRadius =
            "12px";

        resultBox.style.whiteSpace =
            "pre-wrap";

        resultBox.style.lineHeight =
            "1.6";

        resultBox.style.fontSize =
            "14px";

        document
            .querySelector(".generator")
            .appendChild(resultBox);
    }

    resultBox.textContent =
        result;

    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ========================================
// CREATE PDF
// ========================================

function createPDF(
    text,
    job,
    documentType
) {

    const { jsPDF } =
        window.jspdf;


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


    const margin = 20;

    const usableWidth =
        pageWidth - margin * 2;


    // --------------------------------
    // TITLE
    // --------------------------------

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(20);

    pdf.text(
        "German CV AI",
        margin,
        25
    );


    // --------------------------------
    // TARGET JOB
    // --------------------------------

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(11);

    pdf.text(
        "Target Job: " + job,
        margin,
        34
    );


    // --------------------------------
    // LINE
    // --------------------------------

    pdf.line(
        margin,
        40,
        pageWidth - margin,
        40
    );


    // --------------------------------
    // CONTENT
    // --------------------------------

    pdf.setFont(
        "helvetica",
        "normal"
    );

    pdf.setFontSize(10.5);


    const lines =
        pdf.splitTextToSize(
            text,
            usableWidth
        );


    let y = 50;

    const lineHeight = 5.5;


    lines.forEach(line => {

        if (
            y >
            pageHeight - 20
        ) {

            pdf.addPage();

            y = 20;
        }

        pdf.text(
            line,
            margin,
            y
        );

        y += lineHeight;
    });


    // --------------------------------
    // FOOTER
    // --------------------------------

    const totalPages =
        pdf.internal.getNumberOfPages();


    for (
        let i = 1;
        i <= totalPages;
        i++
    ) {

        pdf.setPage(i);

        pdf.setFontSize(8);

        pdf.setTextColor(120);

        pdf.text(
            "Generated by GermanCV AI",
            margin,
            pageHeight - 10
        );

        pdf.text(
            "Page " + i + " / " + totalPages,
            pageWidth - margin,
            pageHeight - 10,
            {
                align: "right"
            }
        );

        pdf.setTextColor(0);
    }


    // --------------------------------
    // FILE NAME
    // --------------------------------

    const safeJob =
        job
            .replace(/[^a-zA-Z0-9äöüÄÖÜß ]/g, "")
            .trim()
            .replace(/\s+/g, "-");


    const fileName =
        documentType === "both"
            ? `German-CV-${safeJob}-Documents.pdf`
            : `German-CV-${safeJob}.pdf`;


    // --------------------------------
    // DOWNLOAD
    // --------------------------------

    pdf.save(fileName);
}
```
