let article = '';
async function fetchArticleContent(url) {
    try {
        console.log("Fetching article!");
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (!data.contents) {
            throw new Error('No content found in the response');
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const paragraphs = doc.querySelectorAll('p');
        let articleText = '';

        paragraphs.forEach(p => {
            articleText += p.textContent + ' ';
        });

        article = articleText;
        console.log(articleText);
        return articleText;
    } catch (error) {
        throw new Error(`Failed to fetch the article: ${error.message}`);
    }
}

const apiKey = 'sk-proj-IO54iz40OQPfd2fiQV1ZT3BlbkFJEghsAsJSKAzKLz2h1Nfs';
let intervieweeRole = '';

async function getIntervieweeDetailsAndQuestions(text) {
    console.log("Fetching Interviewee Details and Main Questions");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: `Please provide a bulleted list of the people interviewed in this article with short descriptions and the main questions that the article is answering (this can be just one person if only one person is interviewed or as many as are interviewed). Article:\n${text}` }
            ],
            max_tokens: 300,
            temperature: 0.7
        })
    });

    const data = await response.json();
    if (response.status === 401) {
        throw new Error("Unauthorized: Invalid API key");
    }

    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
    } else {
        throw new Error("Failed to get details from the OpenAI API");
    }
}

async function simulateInterviewee(role) {
    console.log("Creating the chatbot...");
    const chatContainer = document.getElementById('chat-container');
    const chat = document.getElementById('chat');
    chatContainer.style.display = 'block';
    chat.innerHTML += `<div class="message bot">I am ${role}, an interviewee from the article. You can ask me questions about the article.</div>`;
}

async function startChat() {
    const url = document.getElementById('url').value;
    const summaryDiv = document.getElementById('summary');

    try {
        const articleText = await fetchArticleContent(url);
        const intervieweeDetails = await getIntervieweeDetailsAndQuestions(articleText);
        summaryDiv.innerHTML = `<h2>Interviewee Details and Main Questions</h2><pre>${intervieweeDetails}</pre>`;

        intervieweeRole = intervieweeDetails.split('\n')[0].replace('-', '').trim();
        await simulateInterviewee(intervieweeRole);
    } catch (error) {
        summaryDiv.innerHTML = `<p>Failed to fetch the article or start the chat. ${error.message}</p>`;
    }
}

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const chat = document.getElementById('chat');
    const userMessage = userInput.value;
    if (!userMessage.trim()) return;

    chat.innerHTML += `<div class="message user">${userMessage}</div>`;
    userInput.value = '';

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    // { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: ` I am going to give details about a personality that I want you to model. I would like you to respond to questions that a high-school journalism student will be asking you for a school newspaper article. I want your answers to be brief and articulate and addressed to the student. Feel free to expand on the attributes and experience of your role and maybe provide personal anecdotes that back them up. Reply to this question as ${intervieweeRole} from this article: ${article}. Try to give similar answers to the interviewee in the article. Talk only like the interviewee you are modeling. Here is the question: ${userMessage}. Only answer this question.` }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (response.status === 401) {
            throw new Error("Unauthorized: Invalid API key");
        }

        if (data.choices && data.choices.length > 0) {
            const botMessage = data.choices[0].message.content.trim();
            chat.innerHTML += `<div class="message bot">${botMessage}</div>`;
            chat.scrollTop = chat.scrollHeight;
        } else {
            throw new Error("Failed to get a response from the OpenAI API");
        }
    } catch (error) {
        chat.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
    }
}
