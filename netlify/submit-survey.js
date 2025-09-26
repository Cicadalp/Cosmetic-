// netlify/submit-survey.js
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the JSON data sent from the client
        const data = JSON.parse(event.body);

        // --- STEP 1: LOG THE DATA (Initial Test) ---
        // For testing, we just log the data to the Netlify Function console.
        console.log("Received new survey submission:", data);

        // --- STEP 2: DATABASE/STORAGE (Future Step) ---
        // To permanently save this data, you would integrate a service here:
        // * **Airtable:** Use the Airtable API to push 'data' to a spreadsheet.
        // * **MongoDB Atlas:** Use the MongoDB client to insert the document.
        // * **Netlify Forms:** (Simplest, but requires HTML form structure)
        // * **Google Sheets:** Use a Sheets API wrapper.

        // --- STEP 3: Return Success ---
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Survey submitted successfully!", submissionId: context.awsRequestId })
        };

    } catch (error) {
        console.error("Submission failed:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to parse submission data.' })
        };
    }
};