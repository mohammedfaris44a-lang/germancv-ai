const pdfInput = document.getElementById("pdfInput");
const fileName = document.getElementById("fileName");
const generateBtn = document.getElementById("generateBtn");
const message = document.getElementById("message");
const userText = document.getElementById("userText");
const jobPosition = document.getElementById("jobPosition");

let extractedPDFText = "";


// ===============================
// PDF READER
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

        message.textContent =
            "✅ PDF read successfully!";

        fileName.textContent =
            "✅ " + file.name + " — Ready";

    } catch (error) {

        console.error(error);

        extractedPDFText = "";

        message.textContent =
            "❌ Could not read this PDF.";
    }
});


// ===============================
// GENERATE WITH AI
// ===============================

generateBtn.addEventListener("click", async function () {

    const text = userText.value.trim();

    const job = jobPosition.value.trim();

    const documentType =
        document.querySelector(
            'input[name="document"]:checked'
        )?.value || "cv";


    const finalInformation =
        text.length > 0
            ? text
            : extractedPDFText;


    // ===============================
    // VALIDATION
    // ===============================

    if (!finalInformation) {

        message.textContent =
            "⚠️ Upload a PDF or enter your information.";

        return;
    }


    if (!job) {

        message.textContent =
            "⚠️ Please enter the target job.";

        jobPosition.focus();

        return;
    }


    // ===============================
    // START AI
    // ===============================

    message.textContent =
        "🤖 AI is creating your German CV...";

    generateBtn.disabled = true;


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
                data.error ||
                "AI generation failed."
            );
        }


        // ===============================
        // SHOW RESULT
        // ===============================

        displayResult(data.result);


        message.textContent =
            "✅ Your German documents are ready!";


    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ " + error.message;

    } finally {

        generateBtn.disabled = false;

    }

});


// ===============================
// DISPLAY AI RESULT
// ===============================

function displayResult(result) {

    let resultBox =
        document.getElementById("resultBox");


    if (!resultBox) {

        resultBox =
            document.createElement("div");

        resultBox.id = "resultBox";

        resultBox.style.marginTop = "25px";

        resultBox.style.padding = "20px";

        resultBox.style.background = "#f8fafc";

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


    resultBox.textContent = result;

    resultBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
