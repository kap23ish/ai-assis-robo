const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');

// Dictionary API endpoint
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Add Speech Recognition
const micButton = document.getElementById('micButton');
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const speech = new SpeechSynthesisUtterance();

// Configure speech settings for a cute male child-like voice
function setupChildVoice() {
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a male voice
    const preferredVoice = voices.find(voice => 
        (voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('boy') ||
        voice.name.toLowerCase().includes('daniel')) &&
        voice.lang.includes('en')  // Ensure English voice
    ) || voices.find(voice => voice.lang.includes('en')) || voices[0];

    speech.voice = preferredVoice;
    speech.pitch = 1.2;   // Much gentler pitch (closer to natural)
    speech.rate = 0.95;   // Almost normal speed
    speech.volume = 0.8;  // Quieter volume
}

// Setup voice when voices are loaded
speechSynthesis.addEventListener('voiceschanged', setupChildVoice);

recognition.continuous = false;
recognition.lang = 'en-US';

micButton.addEventListener('click', () => {
    if (micButton.classList.contains('recording')) {
        recognition.stop();
    } else {
        recognition.start();
        micButton.classList.add('recording');
    }
});

recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    userInput.value = text;
    sendMessage();
};

recognition.onend = () => {
    micButton.classList.remove('recording');
};

async function processMessage(message) {
    const words = message.toLowerCase().split(' ');
    
    // Enhanced word detection
    if (message.toLowerCase().includes('what is') || 
        message.toLowerCase().includes('define') || 
        message.toLowerCase().includes('meaning of') ||
        message.toLowerCase().includes('tell me about')) {
        
        // Extract the word to look up
        let wordToDefine = '';
        if (message.toLowerCase().includes('meaning of')) {
            wordToDefine = words[words.indexOf('of') + 1];
        } else if (message.toLowerCase().includes('what is')) {
            wordToDefine = words[words.indexOf('is') + 1];
        } else if (message.toLowerCase().includes('define')) {
            wordToDefine = words[words.indexOf('define') + 1];
        } else if (message.toLowerCase().includes('tell me about')) {
            wordToDefine = words[words.indexOf('about') + 1];
        }

        // Clean the word
        wordToDefine = wordToDefine.replace(/[^a-zA-Z]/g, '');

        try {
            const response = await fetch(DICTIONARY_API + wordToDefine);
            const data = await response.json();
            
            if (data.length > 0) {
                // Get all meanings and examples
                let fullDefinition = `The word "${wordToDefine}" means:\n`;
                let definitions = [];
                
                data[0].meanings.forEach((meaning, index) => {
                    if (index < 3) { // Limit to 3 definitions for clarity
                        const partOfSpeech = meaning.partOfSpeech;
                        const definition = meaning.definitions[0].definition;
                        const example = meaning.definitions[0].example;
                        
                        definitions.push(`As a ${partOfSpeech}: ${definition}`);
                        if (example) {
                            definitions.push(`Example: "${example}"`);
                        }
                    }
                });

                fullDefinition += definitions.join('\n');

                // Add pronunciation if available
                if (data[0].phonetic) {
                    fullDefinition += `\nPronunciation: ${data[0].phonetic}`;
                }

                // Add a cute response
                const cuteResponses = [
                    "I found this word! ",
                    "Here's what this word means: ",
                    "Let me explain this word: ",
                    "I can help you understand this word. "
                ];
                const cuteResponse = cuteResponses[Math.floor(Math.random() * cuteResponses.length)];
                
                const botResponse = cuteResponse + fullDefinition;
                addMessage(botResponse, 'bot');
                speakResponse(botResponse);
            } else {
                const botResponse = `Oopsie! I couldn't find the meaning of "${wordToDefine}". Can you try another word?`;
                addMessage(botResponse, 'bot');
                speakResponse(botResponse);
            }
        } catch (error) {
            const botResponse = "Oh no! I'm having trouble looking up that word. Can we try again?";
            addMessage(botResponse, 'bot');
            speakResponse(botResponse);
        }
    } else {
        // Enhanced conversational responses
        const responses = [
            "Hi! I can help you learn new words. What would you like to know?",
            "You can ask me about any word you'd like to learn.",
            "Try asking me 'What is happiness?' or 'What does adventure mean?'",
            "I'm here to help you learn new words. What word interests you?",
            "Ask me about any word, and I'll explain what it means."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'bot');
        speakResponse(randomResponse);
    }
}

// Update the speakResponse function for a much gentler voice
function speakResponse(text) {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Split long responses into sentences for more natural speech
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
    sentences.forEach((sentence, index) => {
        const utterance = new SpeechSynthesisUtterance(sentence.trim());
        
        // Set much gentler voice properties
        utterance.pitch = 1.2;     // More natural pitch
        utterance.rate = 0.95;     // Almost normal speed
        utterance.volume = 0.8;    // Softer volume
        
        // Try to use the same voice as set in setupChildVoice
        utterance.voice = speech.voice;
        
        // Add natural pauses between sentences
        utterance.onend = () => {
            if (index < sentences.length - 1) {
                setTimeout(() => {
                    const pause = new SpeechSynthesisUtterance('.');
                    pause.pitch = 1.2;
                    pause.rate = 0.95;
                    pause.volume = 0.8;
                    pause.voice = speech.voice;
                    window.speechSynthesis.speak(pause);
                }, 500); // Longer pause for more natural speech
            }
        };
        
        window.speechSynthesis.speak(utterance);
    });
}

function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    processMessage(message);
    userInput.value = '';
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender + '-message');
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Update error messages to be gentler
recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    micButton.classList.remove('recording');
    addMessage("Aww, I couldn't hear you clearly. Can we try that again?", 'bot');
};

// Allow sending message with Enter key
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
}); 