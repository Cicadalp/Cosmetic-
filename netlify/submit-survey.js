// netlify/submit-survey.js - FINAL VALIDATED VERSION

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzRYBQTeuC4Hgp9-S5ILa6LguppGxb_keBHpcOipEo9oT_fwV7aWhgEc4gfO1fkQflV/exec';

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
            const phone = responses['phone-q21'];

            // Check if name, email, or phone is missing/empty when required
            if (!name || name.trim() === '' || !email || email.trim() === '' || !phone || phone.trim() === '') {
                console.error("Validation Error: Missing Name, Email, or Phone for Q21 follow-up.");
                return {
                    statusCode: 422, // Unprocessable Entity
                    body: JSON.stringify({ error: 'Veuillez fournir votre nom, email et numéro de téléphone pour participer aux concours/tests de produits.' })
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

        // 4. Submit to Google Sheets
        try {
            const formData = new FormData();
            formData.append('timestamp', new Date().toISOString());
            for (const id in responses) {
                let value = responses[id];
                if (Array.isArray(value)) value = value.join(', ');
                formData.append(id, value);
            }
            const gasResponse = await fetch(GAS_URL, { method: 'POST', body: formData });
            if (!gasResponse.ok) {
                console.error('Failed to submit to Google Sheets');
                return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save to database.' }) };
            }
        } catch (error) {
            console.error('Error submitting to Google Sheets:', error);
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save to database.' }) };
        }

        // 5. Success Response
        console.log("Received and validated new survey submission (including optional opt-in checks):", data);

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
