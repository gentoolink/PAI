#!/usr/bin/env bun
/**
 * User Prompt Submit Hook - Voice greeting when Sol starts working
 * Triggered when user submits a request and Sol begins processing
 * Announces when Sol is starting work on the task
 */

interface NotificationPayload {
  title: string;
  message: string;
  voice_enabled: boolean;
  priority?: 'low' | 'normal' | 'high';
  voice_id: string;
}

interface HookInput {
  session_id: string;
  prompt: string;
  transcript_path: string;
  hook_event_name: string;
}

/**
 * Generate conversational task summary from user prompt (action-oriented)
 * Dynamically extracts the actual task being requested
 */
function generateTaskSummary(prompt: string): string {
  // Clean and extract meaningful words from the prompt
  const cleanPrompt = prompt.replace(/[^\w\s]/g, ' ').trim();
  const words = cleanPrompt.split(/\s+/).filter(word => 
    word.length > 2 && 
    !['the', 'and', 'but', 'for', 'are', 'with', 'his', 'her', 'this', 'that', 'you', 'can', 'will', 'have', 'been', 'your', 'from', 'they', 'were', 'said', 'what', 'them', 'just', 'told', 'said'].includes(word.toLowerCase())
  );
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Dynamic extraction based on actual content
  let actionWord = '';
  let subjectWords = [];
  
  // Find the primary action verb from the actual prompt
  const actionVerbs = ['fix', 'debug', 'research', 'write', 'create', 'make', 'build', 'implement', 'analyze', 'review', 'update', 'modify', 'generate', 'develop', 'design', 'test', 'deploy', 'configure', 'setup', 'install', 'remove', 'delete', 'add', 'check', 'verify', 'validate', 'optimize', 'refactor', 'enhance', 'improve', 'send', 'email', 'help'];
  
  for (const verb of actionVerbs) {
    if (lowerPrompt.includes(verb)) {
      actionWord = verb;
      break;
    }
  }
  
  // If no specific action found, infer from context
  if (!actionWord) {
    if (lowerPrompt.includes('hook') || lowerPrompt.includes('static') || lowerPrompt.includes('dynamic')) {
      actionWord = 'fixing';
    } else if (lowerPrompt.includes('?')) {
      actionWord = 'answering';
    } else if (lowerPrompt.includes('greeting') || lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      actionWord = 'responding';
    } else {
      actionWord = 'handling';
    }
  } else {
    // Convert to progressive form for "I'm [verb]ing"
    if (actionWord.endsWith('e')) {
      actionWord = actionWord.slice(0, -1) + 'ing';
    } else if (actionWord === 'fix') {
      actionWord = 'fixing';
    } else if (actionWord === 'debug') {
      actionWord = 'debugging';
    } else if (!actionWord.endsWith('ing')) {
      actionWord = actionWord + 'ing';
    }
  }
  
  // Extract key subject matter (skip common words, focus on nouns/topics)
  const skipWords = ['user', 'prompt', 'thing', 'says', 'responding', 'greeting', 'properly', 'interpreting', 'section', 'those', 'things', 'some', 'that', 'have', 'your', 'need', 'dynamically', 'respond', 'describing', 'exactly', 'doing', 'basically', 'words', 'static', 'fucking', 'line', 'told', 'just'];
  
  subjectWords = words.filter(word => 
    !actionVerbs.includes(word.toLowerCase()) &&
    !skipWords.includes(word.toLowerCase()) &&
    !word.toLowerCase().includes(actionWord.replace('ing', '')) &&
    word.length > 2
  ).slice(0, 3);
  
  // Build the dynamic summary
  let summary = actionWord;
  
  // Add the most relevant subject words
  for (const word of subjectWords.slice(0, 3)) {
    summary += ' ' + word.toLowerCase();
  }
  
  // If we don't have enough specific words, extract more aggressively
  if (subjectWords.length === 0) {
    const fallbackWords = prompt.split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !/^(the|and|but|for|are|with|his|her|this|that|you|can|will|have|been|your|from|they|were|said|what|them|some|those|thing|says|just|told|fucking)$/i.test(word)
      )
      .slice(0, 3);
    
    for (const word of fallbackWords) {
      summary += ' ' + word.toLowerCase();
    }
  }
  
  // Clean up the summary
  summary = summary.replace(/\s+/g, ' ').trim();
  
  // Make it conversational by adding "for you" or similar
  if (!summary.includes('for you') && !summary.includes('that') && !summary.includes('this')) {
    if (subjectWords.length > 0) {
      summary += ' for you';
    } else {
      summary += ' that for you';
    }
  }
  
  return summary;
}

/**
 * Generate greeting phrase for when Sol starts working
 */
function generateVoiceGreeting(): string {
  const greetings = [
    "Okay, I'm",
    "Sure thing, I'm",
    "Got it, I'm",
    "Alright, I'm",
    "On it, I'm",
    "Absolutely, I'm",
    "Right away, I'm",
    "Perfect, I'm",
    "Sounds good, I'm",
    "Will do, I'm"
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Send notification to the Kai notification server
 */
async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    const response = await fetch('http://localhost:8888/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('Notification server error:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Read stdin with timeout
 */
async function readStdinWithTimeout(timeout: number = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => {
      reject(new Error('Timeout reading from stdin'));
    }, timeout);
    
    process.stdin.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    
    process.stdin.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function main() {
  try {
    const input = await readStdinWithTimeout();
    const data: HookInput = JSON.parse(input);
    
    // DISABLED: Immediate voice notification causes janky experience
    // Voice feedback should come from completion hooks instead
    // This ensures clean, single voice notification after AI processing completes
    
    // Generate greeting with task summary (keeping for future use)
    // const greeting = generateVoiceGreeting();
    // const taskSummary = generateTaskSummary(data.prompt);
    // const fullMessage = `${greeting}, ${taskSummary}`;
    
    // COMMENTED OUT: Send notification with Sol's voice
    // const payload: NotificationPayload = {
    //   title: 'Sol',
    //   message: fullMessage,
    //   voice_enabled: true,
    //   priority: 'low',
    //   voice_id: 'jqcCZkN6Knx8BJ5TBdYR'  // Sol's main voice ID
    // };
    
    // await sendNotification(payload);
    
    process.exit(0);
  } catch (error) {
    console.error('UserPromptSubmit hook error:', error);
    process.exit(1);
  }
}

main();