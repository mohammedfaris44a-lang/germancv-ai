const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";

// ===============================
// PDF UPLOAD
// ===============================

pdfInput.addEventListener("change", async function () {

    if (!this.files || !this.files.length) {
        return;
    }

    const file = this.files[0];

    if (file.type !== "application/pdf") {
        message.textContent = "❌ Please select a PDF file.";
        return;
    }

    fileName.textContent = "📄 Reading: " + file.name;
    message.textContent = "⏳ Reading your PDF...";

    try {

        const arrayBuffer = await file.arrayBuffer();

        // Check if PDF.js is available
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

            fileName.textContent =
                "📄 " + file.name;

            return;
        }

        message.textContent =
            "✅ PDF read successfully!";

        fileName.textContent =
            "✅ " + file.name + " — Ready";

        console.log("========== PDF TEXT ==========");
        console.log(extractedPDFText);
        console.log("==============================");

    } catch (error) {

        console.error("PDF ERROR:", error);

        extractedPDFText = "";

        message.textContent =
            "❌ Could not read this PDF.";

        fileName.textContent =
            "📄 " + file.name;
    }
});


// ===============================
// GENERATE BUTTON
// ===============================

generateBtn.addEventListener("click", function () {

    const text = userText.value.trim();

    const job = jobPosition.value.trim();

    // Use typed text first.
    // If there is no typed text, use PDF text.
    const finalInformation =
        text.length > 0
            ? text
            : extractedPDFText;

    console.log("========== GENERATION ==========");
    console.log("Job:", job);
    console.log("Information:", finalInformation);
    console.log("================================");

    // No information
    if (!finalInformation) {

        message.textContent =
            "⚠️ Upload a PDF or enter your information.";

        return;
    }

    // No job
    if (!job) {

        message.textContent =
            "⚠️ Please enter the target job.";

        jobPosition.focus();

        return;
    }

    // Everything is ready
    message.textContent =
        "⏳ Preparing your German CV...";

    generateBtn.disabled = true;

    setTimeout(function () {

        generateBtn.disabled = false;

        message.textContent =
            "✅ Information ready for AI processing!";

    }, 1000);

});
