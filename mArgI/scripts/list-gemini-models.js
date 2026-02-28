// Script to list all available Gemini models
// Run with: node scripts/list-gemini-models.js YOUR_API_KEY
// Or set GEMINI_API_KEY environment variable

const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ Please provide API key as argument or set GEMINI_API_KEY environment variable');
    console.error('Usage: node scripts/list-gemini-models.js YOUR_API_KEY');
    process.exit(1);
}

async function listGeminiModels() {
    console.log('🔍 Fetching available Gemini models...\n');

    try {
        // List models using v1 API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            process.exit(1);
        }

        const data = await response.json();
        
        console.log('✅ Available Models:\n');
        console.log('='.repeat(80));
        
        // Filter for models that support generateContent
        const generateContentModels = data.models.filter(model => 
            model.supportedGenerationMethods?.includes('generateContent')
        );

        console.log(`\n📊 Total models: ${data.models.length}`);
        console.log(`📝 Models supporting generateContent: ${generateContentModels.length}\n`);
        console.log('='.repeat(80));

        if (generateContentModels.length > 0) {
            console.log('\n✨ Models that support generateContent:\n');
            
            generateContentModels.forEach((model, index) => {
                console.log(`${index + 1}. ${model.name}`);
                console.log(`   Display Name: ${model.displayName}`);
                console.log(`   Description: ${model.description}`);
                console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
                console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
                console.log(`   Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
                console.log('');
            });

            console.log('='.repeat(80));
            console.log('\n💡 Recommended models for your use case:\n');
            
            // Find the best models
            const flashModels = generateContentModels.filter(m => 
                m.name.includes('flash') || m.displayName.toLowerCase().includes('flash')
            );
            
            const proModels = generateContentModels.filter(m => 
                m.name.includes('pro') || m.displayName.toLowerCase().includes('pro')
            );

            if (flashModels.length > 0) {
                console.log('⚡ Flash Models (Fast & Efficient):');
                flashModels.forEach(m => {
                    const modelId = m.name.replace('models/', '');
                    console.log(`   - ${modelId}`);
                });
                console.log('');
            }

            if (proModels.length > 0) {
                console.log('🎯 Pro Models (More Capable):');
                proModels.forEach(m => {
                    const modelId = m.name.replace('models/', '');
                    console.log(`   - ${modelId}`);
                });
                console.log('');
            }

            // Show the first available model as a suggestion
            const firstModel = generateContentModels[0].name.replace('models/', '');
            console.log('='.repeat(80));
            console.log(`\n✅ Use this model in your code: '${firstModel}'\n`);
            
            // Show code snippet
            console.log('📝 Update your dashboard.js with:');
            console.log(`\nconst modelNames = ['${firstModel}'];\n`);
            
        } else {
            console.log('\n⚠️  No models supporting generateContent found.');
        }

        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

listGeminiModels();
