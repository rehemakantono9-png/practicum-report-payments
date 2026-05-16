// netlify/functions/groq-generate.js
// AI Report Generation using Groq API

const GROQ_API_KEY = process.env.GROQ_API_KEY;

exports.handler = async (event) => {
    // Handle CORS preflight request (important for cross-domain requests)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }
    
    try {
        const { prompt } = JSON.parse(event.body);
        
        if (!prompt) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: 'Missing prompt' })
            };
        }
        
        // If no API key (demo mode), return a sample report
        if (!GROQ_API_KEY || GROQ_API_KEY === '') {
            const sampleReport = `<div class="premium-report">
<div class="title-page">
<div class="uni-name">Islamic University in Uganda</div>
<div class="faculty-name">Faculty of Arts and Social Sciences</div>
<div class="report-title">INTERNSHIP REPORT</div>
<div class="student-name">Student Name</div>
<div class="submission-info">Internship Report</div>
</div>
<div class="chapter">
<h2>CHAPTER ONE: INTRODUCTION</h2>
<p>This internship provided valuable practical experience in a professional environment.</p>
</div>
<div class="chapter">
<h2>CHAPTER TWO: ACTIVITIES</h2>
<p>The student engaged in various activities that developed professional competencies.</p>
</div>
</div>`;
            
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, content: sampleReport, mode: 'demo' })
            };
        }
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional report writer. Generate academic internship reports. Use proper HTML formatting with h2 for chapters and h3 for subheadings. Never mention that you are AI. Write in formal academic English.' 
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, content: data.choices[0].message.content })
            };
        } else {
            console.error('Groq API error:', data);
            return {
                statusCode: 500,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, error: data.error?.message || 'AI generation failed' })
            };
        }
        
    } catch (error) {
        console.error('Groq function error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
