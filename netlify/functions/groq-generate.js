// netlify/functions/groq-generate.js
// This function handles AI report generation using Groq API

const GROQ_API_KEY = process.env.GROQ_API_KEY;

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { prompt } = JSON.parse(event.body);
        
        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: 'Missing prompt' })
            };
        }
        
        // If no API key (demo mode), return a sample report
        if (!GROQ_API_KEY || GROQ_API_KEY === '') {
            // Return a sample report for demonstration
            const studentName = prompt.match(/Name: (.*?)(?:\n|$)/)?.[1] || 'Student';
            const currentDate = new Date().toLocaleDateString('en-GB');
            
            const sampleReport = `<div class="premium-report">
<div class="title-page">
<div class="uni-name">Islamic University in Uganda</div>
<div class="faculty-name">Faculty of Arts and Social Sciences</div>
<div class="logo-placeholder">☐</div>
<div class="report-title">INTERNSHIP REPORT</div>
<div class="student-name">${escapeHtml(studentName)}</div>
<div class="submission-info">Submitted in partial fulfillment of the requirements</div>
<div class="date">${currentDate}</div>
</div>

<div class="page-break"></div>

<div class="declaration-box">
<h2>DECLARATION</h2>
<p>I, ${escapeHtml(studentName)}, hereby declare that this internship report is my original work and has not been submitted for any other qualification.</p>
<div class="signature-line">Signature: _________________ Date: ${currentDate}</div>
</div>

<div class="page-break"></div>

<div class="chapter">
<h2>CHAPTER ONE: INTRODUCTION</h2>
<h3>1.1 Background of Internship</h3>
<p>This internship was undertaken to fulfill the practical training requirements of the academic programme. The experience provided valuable exposure to professional workplace operations.</p>
<h3>1.2 Objectives</h3>
<ul>
<li>To apply theoretical knowledge to practical work situations</li>
<li>To gain professional experience and develop workplace competencies</li>
<li>To understand organizational culture and operations</li>
</ul>
</div>

<div class="page-break"></div>

<div class="chapter">
<h2>CHAPTER TWO: INTERNSHIP ACTIVITIES</h2>
<p>During the internship period, the student engaged in various activities that developed professional skills and practical competencies. These included daily tasks assigned by the supervisor, participation in team meetings, and completion of specific projects.</p>
</div>

<div class="page-break"></div>

<div class="chapter">
<h2>CHAPTER THREE: SKILLS AND LEARNING</h2>
<p>The internship enabled the development of communication, teamwork, problem-solving, and time management skills. The student learned to work under pressure, meet deadlines, and collaborate effectively with colleagues.</p>
</div>

<div class="page-break"></div>

<div class="chapter">
<h2>CHAPTER FOUR: CONCLUSION AND RECOMMENDATIONS</h2>
<h3>4.1 Conclusion</h3>
<p>The internship was a transformative learning experience that bridged the gap between academic theory and professional practice.</p>
<h3>4.2 Recommendations</h3>
<p>Future students should be proactive, maintain detailed documentation, and seek feedback regularly. The university should strengthen pre-internship orientation programs.</p>
</div>

<div class="page-break"></div>

<div class="references">
<h2>REFERENCES</h2>
<p>Islamic University in Uganda Internship Guidelines Handbook</p>
</div>
</div>`;
            
            function escapeHtml(str) {
                if (!str) return '';
                return str.replace(/[&<>]/g, function(m) {
                    if (m === '&') return '&amp;';
                    if (m === '<') return '&lt;';
                    if (m === '>') return '&gt;';
                    return m;
                });
            }
            
            return {
                statusCode: 200,
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
                body: JSON.stringify({ success: true, content: data.choices[0].message.content })
            };
        } else {
            console.error('Groq API error:', data);
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, error: data.error?.message || 'AI generation failed' })
            };
        }
        
    } catch (error) {
        console.error('Groq function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
