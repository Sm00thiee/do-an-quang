/**
 * Implementation Validation Test
 * Tests the Supabase dual-instance setup without requiring a running server
 */

// Mock environment variables for testing
process.env.REACT_APP_SUPABASE_URL = 'https://test-main.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-main-key';
process.env.REACT_APP_CHAT_SUPABASE_URL = 'https://test-chat.supabase.co';
process.env.REACT_APP_CHAT_SUPABASE_ANON_KEY = 'test-chat-key';
process.env.REACT_APP_CHAT_SUPABASE_EDGE_FUNCTIONS_URL = 'https://test-chat.supabase.co/functions/v1';

// Test results
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        tests.push({ name, status: 'PASS', error: null });
        passed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        tests.push({ name, status: 'FAIL', error: error.message });
        failed++;
        console.error(`❌ ${name}: ${error.message}`);
    }
}

// Test 1: Verify supabase.js exports both clients
test('supabase.js exports supabaseMain and supabaseChat', () => {
    // This would require importing, but we can check the file structure
    const fs = require('fs');
    const supabaseContent = fs.readFileSync('./src/services/supabase.js', 'utf8');
    
    if (!supabaseContent.includes('supabaseMain')) {
        throw new Error('supabaseMain not found in supabase.js');
    }
    if (!supabaseContent.includes('supabaseChat')) {
        throw new Error('supabaseChat not found in supabase.js');
    }
    if (!supabaseContent.includes('CHAT_EDGE_FUNCTIONS_URL')) {
        throw new Error('CHAT_EDGE_FUNCTIONS_URL not found in supabase.js');
    }
});

// Test 2: Verify chatService.js uses supabaseChat
test('chatService.js uses supabaseChat', () => {
    const fs = require('fs');
    const chatServiceContent = fs.readFileSync('./src/services/chatService.js', 'utf8');
    
    if (!chatServiceContent.includes('supabaseChat')) {
        throw new Error('chatService.js does not use supabaseChat');
    }
    if (!chatServiceContent.includes('CHAT_EDGE_FUNCTIONS_URL')) {
        throw new Error('chatService.js does not use CHAT_EDGE_FUNCTIONS_URL');
    }
    if (chatServiceContent.includes("from './supabase'") && 
        chatServiceContent.match(/supabase[^C]/) && 
        !chatServiceContent.includes('supabaseChat')) {
        throw new Error('chatService.js may still be using old supabase client');
    }
});

// Test 3: Verify sessionService.js uses supabaseChat
test('sessionService.js uses supabaseChat', () => {
    const fs = require('fs');
    const sessionServiceContent = fs.readFileSync('./src/services/sessionService.js', 'utf8');
    
    if (!sessionServiceContent.includes('supabaseChat')) {
        throw new Error('sessionService.js does not use supabaseChat');
    }
});

// Test 4: Verify supabaseService.js exists and has correct structure
test('supabaseService.js exists with correct structure', () => {
    const fs = require('fs');
    if (!fs.existsSync('./src/services/supabaseService.js')) {
        throw new Error('supabaseService.js does not exist');
    }
    
    const supabaseServiceContent = fs.readFileSync('./src/services/supabaseService.js', 'utf8');
    
    if (!supabaseServiceContent.includes('getChatClient')) {
        throw new Error('getChatClient method not found');
    }
    if (!supabaseServiceContent.includes('getMainClient')) {
        throw new Error('getMainClient method not found');
    }
    if (!supabaseServiceContent.includes('getClientForTable')) {
        throw new Error('getClientForTable method not found');
    }
});

// Test 5: Verify .env has chat variables
test('.env file has chat Supabase variables', () => {
    const fs = require('fs');
    if (!fs.existsSync('./.env')) {
        throw new Error('.env file does not exist');
    }
    
    const envContent = fs.readFileSync('./.env', 'utf8');
    
    if (!envContent.includes('REACT_APP_CHAT_SUPABASE_URL')) {
        throw new Error('REACT_APP_CHAT_SUPABASE_URL not found in .env');
    }
    if (!envContent.includes('REACT_APP_CHAT_SUPABASE_ANON_KEY')) {
        throw new Error('REACT_APP_CHAT_SUPABASE_ANON_KEY not found in .env');
    }
    if (!envContent.includes('REACT_APP_CHAT_SUPABASE_EDGE_FUNCTIONS_URL')) {
        throw new Error('REACT_APP_CHAT_SUPABASE_EDGE_FUNCTIONS_URL not found in .env');
    }
});

// Test 6: Verify alternative chat services are updated
test('chatService.freeTier.js uses supabaseChat', () => {
    const fs = require('fs');
    if (fs.existsSync('./src/services/chatService.freeTier.js')) {
        const content = fs.readFileSync('./src/services/chatService.freeTier.js', 'utf8');
        if (!content.includes('supabaseChat')) {
            throw new Error('chatService.freeTier.js does not use supabaseChat');
        }
    }
});

test('chatService.intelligent.js uses supabaseChat', () => {
    const fs = require('fs');
    if (fs.existsSync('./src/services/chatService.intelligent.js')) {
        const content = fs.readFileSync('./src/services/chatService.intelligent.js', 'utf8');
        if (!content.includes('supabaseChat')) {
            throw new Error('chatService.intelligent.js does not use supabaseChat');
        }
    }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${tests.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
    console.log('\nFailed Tests:');
    tests.filter(t => t.status === 'FAIL').forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
