// netlify/submit-survey.js - FINAL VALIDATED VERSION

exports.handler = async (event, context) => {
    // 1. Basic Security Check: Ensure it's a POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const responses = data.surveyResponses;

        // 2. Basic Structure Validation
        if (!data || !responses || typeof responses !== 'object') {
            console.error("Validation Error: Missing or invalid surveyResponses object.");
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'Invalid submission data format.' })
            };
        }

        // 3. Conditional Opt-In Validation for Q21
        const q21Answers = responses['q21'];
        
        // We only proceed with validation if q21 is an array and contains an opt-in answer.
        // The opt-out option is 'No, just completing the survey'.
        const hasOptedIn = Array.isArray(q21Answers) && q21Answers.some(
            option => option !== 'No, just completing the survey'
        );

        if (hasOptedIn) {
            const name = responses['name-q21'];
            const email = responses['email-q21'];

            // Check if name or email is missing/empty when required
            if (!name || name.trim() === '' || !email || email.trim() === '') {
                console.error("Validation Error: Missing Name or Email for Q21 follow-up.");
                return {
                    statusCode: 422, // Unprocessable Entity
                    body: JSON.stringify({ error: 'Veuillez fournir votre nom et email pour participer aux concours/tests de produits.' })
                };
            }
            // Basic Email format check
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                console.error("Validation Error: Invalid Email format for Q21 follow-up.");
                return {
                    statusCode: 422,
                    body: JSON.stringify({ error: 'Le format de l\'email est invalide.' })
                };
            }
        }
        
        // 4. Success Response
        console.log("Received and validated new survey submission (including optional opt-in checks):", data);

        // --- Database/Storage Integration would go here ---

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Survey submitted successfully!", submissionId: context.awsRequestId })
        };

    } catch (error) {
        // Catches errors like invalid JSON parsing
        console.error("Submission failed due to JSON parsing or unexpected error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process submission. Check request format.' })
        };
    }
};