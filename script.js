const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";


// ========================================
// READ PDF
// ========================================

pdfInput.addEventListener("change", async function () {

    if (!this.files || !this.files.length) return;

    const file = this.files[0];

    if (file.type !== "application/pdf") {
        message.textContent = "❌ Please select a PDF file.";
        return;
    }

    fileName.textContent = "📄 Reading: " + file.name;
    message.textContent = "⏳ Reading your PDF...";

    try {

        const arrayBuffer = await file.arrayBuffer();

        if (typeof pdfjsLib === "undefined") {
            throw new Error("PDF.js is not loaded.");
        }

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;

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
// GENERATE
// ========================================

generateBtn.addEventListener("click", async function () {

    const text = userText.value.trim();

    const job = jobPosition.value.trim();

    const documentType =
        document.querySelector(
            'input[name="document"]:checked'
        )?.value || "cv";

    const finalInformation =
        text || extractedPDFText;


    if (!finalInformation) {

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

    generateBtn.textContent =
        "⏳ Creating...";

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
                    information: finalInformation,
                    job: job,
                    document: documentType
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.error || "AI generation failed."
            );
        }


        if (!data.result) {
            throw new Error(
                "AI returned no result."
            );
        }


        // Show result
        showResult(data.result);


        // Create PDF
        createPDF(data.result, job);


        message.textContent =
            "✅ PDF created successfully!";


    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ " + error.message;

    } finally {

        generateBtn.disabled = false;

        generateBtn.textContent =
            "✨ Generate Documents";
    }
});


// ========================================
// SHOW RESULT
// ========================================

function showResult(text) {

    let resultBox =
        document.getElementById("resultBox");

    if (!resultBox) {

        resultBox =
            document.createElement("div");

        resultBox.id = "resultBox";

        resultBox.style.marginTop = "25px";
        resultBox.style.padding = "20px";
        resultBox.style.background = "white";
        resultBox.style.border = "1px solid #e5e7eb";
        resultBox.style.borderRadius = "12px";
        resultBox.style.whiteSpace = "pre-wrap";
        resultBox.style.lineHeight = "1.6";

        document
            .querySelector(".generator")
            .appendChild(resultBox);
    }

    resultBox.textContent = text;
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
            "PDF generator is not loaded. Please refresh the page."
        );
    }


    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();


    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();


    const margin = 20;

    const maxWidth =
        pageWidth - (margin * 2);


    // Title
    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(20);

    pdf.text(
        "German CV",
        margin,
        25
    );


    // Job
    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(11);

    pdf.text(
        "Target Job: " + job,
        margin,
        34
    );


    // Line
    pdf.line(
        margin,
        40,
        pageWidth - margin,
        40
    );


    // Text
    pdf.setFontSize(10);

    const lines =
        pdf.splitTextToSize(
            text,
            maxWidth
        );


    let y = 50;


    for (const line of lines) {

        if (y > pageHeight - 20) {

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


    // Download
    const safeJob =
        job
            .replace(/[^a-zA-Z0-9äöüÄÖÜß ]/g, "")
            .trim()
            .replace(/\s+/g, "-");


    pdf.save(
        `German-CV-${safeJob || "Document"}.pdf`
    );
}
