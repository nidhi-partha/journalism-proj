document.addEventListener('DOMContentLoaded', () => {
    const recordBtn = document.getElementById('recordBtn');
    const inputText = document.getElementById('inputText');
    const transcriptContent = document.getElementById('transcriptContent');
    const finishBtn = document.getElementById('finishBtn');
    const wave = document.getElementById('wave');
    let recognition;
    let isRecording = false;

    function initRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isRecording = true;
                recordBtn.src = 'mic.png'; // change mic icon
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const speechResult = event.results[i][0].transcript;
                        addToTranscript(`<p><strong>You:</strong> ${speechResult}</p>`);
                        inputText.value = '';
                        getResponse(speechResult);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                inputText.value = interimTranscript;
            };

            recognition.onerror = (event) => {
                console.error(`Error occurred in recognition: ${event.error}`);
            };

            recognition.onend = () => {
                isRecording = false;
                recordBtn.src = 'mic.png'; // change mic icon back
            };
        } else {
            transcriptContent.textContent = 'Web Speech API is not supported in this browser.';
        }
    }

    recordBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    finishBtn.addEventListener('click', () => {
        recognition.stop();
        isRecording = false;
    });

    initRecognition();

    const apiKey = ''; // Replace with your actual OpenAI API key

    async function getResponse(text) {
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
                    { role: 'user', content: `I am going to give details about a personality that I want you to model. I would like you to respond to questions that a high-school journalism student will be asking you for a school newspaper article. I want your answers to be brief and articulate and addressed to the student. Feel free to expand on the attributes and experience of your role and maybe provide personal anecdotes that back them up. Reply to this question as Cristiano Ronaldo, famous football player. Talk only like the interviewee you are modeling. Here is the question: ${text}. Only answer this question.` }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        const data = await response.json();
        const responseText = data.choices[0].message.content.trim();
        addToTranscript(`<p><strong>Interviewee:</strong> ${responseText}</p>`);
        speakText(responseText);
    }

    function speakText(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => {
            wave.style.animation = 'speaking 1s infinite';
        };
        utterance.onend = () => {
            wave.style.animation = 'none';
        };
        window.speechSynthesis.speak(utterance);
    }

    function addToTranscript(html) {
        transcriptContent.innerHTML += html;
        transcriptContent.scrollTop = transcriptContent.scrollHeight; // Scroll to the bottom
    }
});
