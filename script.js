```javascript id="m4k2qa"
document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // ELEMENTS
    // =========================

    const pdfInput = document.getElementById("pdfInput");
    const fileName = document.getElementById("fileName");
    const generateBtn = document.getElementById("generateBtn");
    const message = document.getElementById("message");
    const userText = document.getElementById("userText");
    const jobPosition = document.getElementById("jobPosition");


    let extractedPDFText = "";


    // =========================
    // PDF UPLOAD
    // =========================

    if (pdfInput) {

        pdfInput.addEventListener("change", async function () {

            const file = pdfInput.files[0];

            if (!file) {
                return;
            }


            if (
                file.type !== "application/pdf" &&
                !file.name.toLowerCase().endsWith(".pdf")
            ) {

                message.textContent =
                    "❌ Please select a PDF file.";

                return;
            }


            fileName.textContent =
                "⏳ Reading " + file.name + "...";

            message.textContent =
                "⏳ Reading your PDF...";


            try {

                // Check PDF.js

                if (
                    typeof pdfjsLib === "undefined"
                ) {

                    throw new Error(
                        "PDF.js is not loaded."
                    );
                }


                pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


                // Read PDF

                const buffer =
                    await file.arrayBuffer();


                const pdf =
                    await pdfjsLib
                        .getDocument({
                            data: buffer
                        })
                        .promise;


                let text = "";


                // Read pages

                for (
                    let i = 1;
                    i <= pdf.numPages;
                    i++
                ) {

                    const page =
                        await pdf.getPage(i);


                    const content =
                        await page.getTextContent();


                    for (
                        const item of content.items
                    ) {

                        if (item.str) {
                            text +=
                                item.str + " ";
                        }
                    }


                    text += "\n";
                }


                extractedPDFText =
                    text.trim();


                if (!extractedPDFText) {

                    fileName.textContent =
                        "⚠️ " + file.name;

                    message.textContent =
                        "⚠️ This PDF contains no readable text.";

                    return;
                }


                // SUCCESS

                fileName.textContent =
                    "✅ " + file.name;

                message.textContent =
                    "✅ PDF uploaded successfully!";


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
                    "❌ Error reading PDF: " +
                    error.message;
            }

        });

    }


    // =========================
    // GENERATE
    // =========================

    if (generateBtn) {

        generateBtn.addEventListener(
            "click",
            async function () {

                const manualText =
                    userText
                        ? userText.value.trim()
                        : "";


                const job =
                    jobPosition
                        ? jobPosition.value.trim()
                        : "";


                // PDF OR TEXT

                const information =
                    manualText ||
                    extractedPDFText;


                // DOCUMENT TYPE

                const selected =
                    document.querySelector(
                        'input[name="document"]:checked'
                    );


                const documentType =
                    selected
                        ? selected.value
                        : "cv";


                // CHECK INFORMATION

                if (!information) {

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


                // LOADING

                generateBtn.disabled =
                    true;


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

                                body:
                                    JSON.stringify({
                                        information:
                                            information,

                                        job:
                                            job,

                                        document:
                                            documentType
                                    })
                            }
                        );


                    // Read response safely

                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            "API request failed."
                        );
                    }


                    if (!data.result) {

                        throw new Error(
                            "No result from AI."
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
                        "✅ German CV created successfully!";


                } catch (error) {

                    console.error(
                        "GENERATE ERROR:",
                        error
                    );


                    message.textContent =
                        "❌ " +
                        error.message;


                } finally {

                    generateBtn.disabled =
                        false;


                    generateBtn.textContent =
                        "✨ Generate Documents";
                }

            }
        );

    }


    // =========================
    // SHOW RESULT
    // =========================

    function showResult(text) {

        let box =
            document.getElementById(
                "resultBox"
            );


        if (!box) {

            box =
                document.createElement(
                    "div"
                );


            box.id =
                "resultBox";


            box.style.marginTop =
                "30px";


            box.style.padding =
                "30px";


            box.style.background =
                "white";


            box.style.border =
                "1px solid #ddd";


            box.style.borderRadius =
                "15px";


            box.style.whiteSpace =
                "pre-wrap";


            box.style.lineHeight =
                "1.7";


            box.style.fontFamily =
                "Arial, sans-serif";


            document
                .getElementById(
                    "resultSection"
                )
                ?.appendChild(box);


            if (!box.parentElement) {

                document.body.appendChild(
                    box
                );
            }
        }


        box.textContent =
            text;
    }


    // =========================
    // CREATE PDF
    // =========================

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


        const jsPDF =
            window.jspdf.jsPDF;


        const pdf =
            new jsPDF({
                orientation:
                    "portrait",

                unit:
                    "mm",

                format:
                    "a4"
            });


        const width =
            pdf.internal.pageSize.getWidth();


        const height =
            pdf.internal.pageSize.getHeight();


        const margin = 18;


        // TITLE

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.setFontSize(
            20
        );


        pdf.text(
            "LEBENSLAUF",
            margin,
            20
        );


        // JOB

        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.setFontSize(
            10
        );


        pdf.text(
            "Position: " + job,
            margin,
            28
        );


        // CONTENT

        const lines =
            pdf.splitTextToSize(
                text,
                width - margin * 2
            );


        let y = 40;


        for (
            const line of lines
        ) {

            if (
                y >
                height - 15
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


        // FILE NAME

        const cleanJob =
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
                cleanJob ||
                "Document"
            ) +
            ".pdf"
        );
    }

});
```
