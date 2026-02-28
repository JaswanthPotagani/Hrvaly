"use server"

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
});

// Refactored generateAIInsights to accept user context
export const generateAIInsights = async (industry, location, userRole, userExperience) => {
    if (!industry) {
        console.warn("Industry is null or undefined. Skipping AI generation.");
        return null;
    }

    if (!location) {
        console.warn("Location is null or undefined. Skipping AI generation.");
        return null;
    }

    try {
        console.log(`Generating AI insights for industry: ${industry} in location: ${location}`);
        const isStudent = userRole === "STUDENT";
        const experience = userExperience || 0;

        const typeSpecificInstructions = isStudent
            ? `
            Analyze the market from the perspective of a **Student/Fresher seeking Campus Placements**.
            - "salaryRanges": Focus strictly on **Entry-Level / Fresher / Trainee / Intern** roles.
            - "salaryFrequency": Use "LPA" (Lakhs Per Annum) or "Stipend" as appropriate.
            - "topSkills": Focus on fundamental skills asked in **placement interviews**.
            - "keyTrends": Focus on hiring trends for fresh graduates (e.g., mass recruiting, remote internships).
            - "recommendedSkills": Focus on skills that differentiate a fresher in interviews.
            `
            : `
            Analyze the market from the perspective of a **Professional with ${experience}+ years of experience**.
            - "salaryRanges": Focus on roles relevant to **${experience}+ years experience** (e.g., Senior, Lead, Manager).
            - "topSkills": Focus on advanced domain expertise and leadership skills.
            - "keyTrends": Focus on career progression, tech stack shifts, and lateral hiring trends.
            `;

        const prompt = `
          Analyze the current state of the ${industry} industry in ${location} and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "${location}" }
            ],
            "growthRate": number,
            "demandLevel": "HIGH" | "MEDIUM" | "LOW",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"],
            "salaryCurrency": "string",
            "salaryFrequency": "string"
          }
          
          IMPORTANT INSTRUCTIONS:
          1. Return ONLY the JSON. No additional text, notes, or markdown formatting.
          2. ${typeSpecificInstructions}
          3. Include exactly 5 common roles.
          4. Salary figures must be in the local currency of ${location} and formatted appropriately.
          5. "salaryCurrency" should be the currency symbol or code (e.g., "₹", "$", "INR").
          6. Growth rate should be a percentage.
          7. Include exactly 5 skills and trends.
          8. Focus on concise skill names (max 3 words per skill).
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
             console.warn("Standard JSON parse failed for insights, attempting cleanup...");
             const fixedJson = cleanedText.replace(/"((?:\\.|[^"\\])*)"/g, (match, p1) => {
               return '"' + p1
                 .replace(/\n/g, "\\n")
                 .replace(/\r/g, "\\r")
                 .replace(/\t/g, "\\t")
                 .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                 + '"';
             });
             return JSON.parse(fixedJson);
        }
        
    } catch (error) {
        console.error("Error generating AI insights:", error);
        throw error;
    }
};

export async function getUserDashboardData() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    // Fetch user with resume and assessments
    const user = await db.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            resume: true,
            assessment: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 10,
            },
            voiceAssessments: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 10,
            },
            badges: true,
            milestones: {
                orderBy: {
                    week: "asc",
                },
            },
            interviews: {
                orderBy: {
                    createdAt: "asc",
                },
                take: 20,
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Fetch or generate industry insights if user has industry/location
    let industryInsight = null;
    if (user.industry && user.location) {
        // Check if insights already exist
        industryInsight = await db.industryInsight.findUnique({
            where: {
                industry_location: {
                    industry: user.industry,
                    location: user.location,
                },
            },
        });

        // If no insights exist, generate them
        if (!industryInsight) {
            // Pass user context (userType and experience) to the generator
            const insights = await generateAIInsights(
                user.industry, 
                user.location, 
                { userType: user.userType, experience: user.experience }
            );
            
            if (insights) {
                industryInsight = await db.industryInsight.upsert({
                    where: {
                        industry_location: {
                            industry: user.industry,
                            location: user.location,
                        },
                    },
                    update: {
                        ...insights,
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                    create: {
                        industry: user.industry,
                        location: user.location,
                        ...insights,
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            }
        }
    }

    return {
        userData: user,
        insights: industryInsight,
    };
}

export async function fetchMarketTrends(user) {
    if (!user.industry) {
        return {
            trendingRoles: [],
            salaryData: null
        };
    }

    // Parse industry field (format: "MainIndustry-specialization")
    const [mainIndustry, specialization] = user.industry.split('-');
    const industryDisplay = mainIndustry || user.industry;
    const specializationDisplay = specialization ? specialization.replace(/-/g, ' ') : '';
    
    // Build context-aware prompt
    const userContext = user.userType === 'student' 
        ? `a ${user.currentYear ? `${user.currentYear}th year` : 'final year'} student in ${user.branch || specializationDisplay || industryDisplay}`
        : `a professional with ${user.experience || 0} years of experience in ${specializationDisplay || industryDisplay}`;
    
    const location = user.location || 'India';

    const prompt = `
    Act as a career market analyst. Analyze the job market for ${userContext} in ${location}.
    
    Industry: ${industryDisplay}
    Specialization: ${specializationDisplay || 'General'}
    Location: ${location}
    User Type: ${user.userType || 'professional'}
    
    Provide:
    1. Top 5 trending job roles/titles that are MOST RELEVANT to this user's profile
    2. Salary data for the most in-demand role (min, median, max)
    
    Return ONLY valid JSON in this exact format:
    {
        "trendingRoles": ["Role 1", "Role 2", "Role 3", "Role 4", "Role 5"],
        "salaryData": {
            "role": "Most In-Demand Role Title",
            "minSalary": number,
            "medianSalary": number,
            "maxSalary": number,
            "currency": "₹" or "$"
        }
    }
    
    Use ₹ for India, $ for other locations. For India, use LPA (Lakhs Per Annum) as the unit.
    For students, focus on entry-level/fresher roles. For professionals, match the experience level.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let data;
        try {
            data = JSON.parse(cleanedJson);
        } catch (parseError) {
             console.warn("Standard JSON parse failed for market trends, attempting cleanup...");
             const fixedJson = cleanedJson.replace(/"((?:\\.|[^"\\])*)"/g, (match, p1) => {
               return '"' + p1
                 .replace(/\n/g, "\\n")
                 .replace(/\r/g, "\\r")
                 .replace(/\t/g, "\\t")
                 .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                 + '"';
             });
             data = JSON.parse(fixedJson);
        }
        
        return {
            trendingRoles: data.trendingRoles || [],
            salaryData: data.salaryData || null
        };
    } catch (error) {
        console.error("Error fetching market trends:", error);
        return {
            trendingRoles: [],
            salaryData: null
        };
    }
}

export async function getUpgradeSkills(user) {
    if (process.env.NODE_ENV === 'development') {
        console.log('[getUpgradeSkills] Called with user:', {
            id: user.id,
            userType: user.userType,
            industry: user.industry,
            experience: user.experience,
            currentYear: user.currentYear,
            branch: user.branch
        });
    }

    if (!user.industry) {
        console.warn('[getUpgradeSkills] No industry found, returning empty data');
        return {
            currentStatus: {},
            upgradeSkills: []
        };
    }

    // Parse industry field
    const [mainIndustry, specialization] = user.industry.split('-');
    const industryDisplay = mainIndustry || user.industry;
    const specializationDisplay = specialization ? specialization.replace(/-/g, ' ') : '';
    
    const experience = user.experience || 0;
    const userType = user.userType || 'professional';
    const skills = user.skills || [];
    const currentYear = user.currentYear;
    const branch = user.branch;

    // Build user context
    let userContext = '';
    let nextLevel = '';
    
    if (userType === 'student') {
        userContext = `${currentYear ? `${currentYear}th year` : 'final year'} student in ${branch || specializationDisplay || industryDisplay}`;
        nextLevel = 'entry-level professional roles';
    } else {
        userContext = `professional with ${experience} years of experience in ${specializationDisplay || industryDisplay}`;
        nextLevel = experience < 2 ? 'mid-level roles' : experience < 5 ? 'senior roles' : 'lead/architect roles';
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('[getUpgradeSkills] User context:', userContext);
        console.log('[getUpgradeSkills] Next level:', nextLevel);
    }

    const prompt = `
    Act as a career development advisor. Analyze a ${userContext}.
    
    Industry: ${industryDisplay}
    Specialization: ${specializationDisplay || 'General'}
    Current skills: ${skills.join(', ') || 'Not specified'}
    User Type: ${userType}
    ${userType === 'professional' ? `Experience: ${experience} years` : `Year: ${currentYear || 'Final'}`}
    
    Provide:
    1. A brief current status summary (1 sentence, encouraging and specific to their profile)
    2. 5 specific, high-impact skills they should learn to transition to ${nextLevel}
    
    Return ONLY valid JSON in this exact format:
    {
        "currentStatus": {
            "role": "${userType === 'student' ? 'Student/Fresher' : 'Professional'}",
            "experience": ${experience},
            "primarySkill": "Most relevant current skill from their list, or infer from specialization",
            "summary": "Brief encouraging summary specific to their profile"
        },
        "upgradeSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
    }
    
    Make the skills VERY SPECIFIC to their specialization and career stage.
    `;

    if (process.env.NODE_ENV === 'development') {
        console.log('[getUpgradeSkills] Calling Gemini AI...');
    }

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[getUpgradeSkills] Raw AI response:', text.substring(0, 200) + '...');
        }
        
        const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let data;
        try {
            data = JSON.parse(cleanedJson);
        } catch (parseError) {
             console.warn("Standard JSON parse failed for upgrade skills, attempting cleanup...");
             const fixedJson = cleanedJson.replace(/"((?:\\.|[^"\\])*)"/g, (match, p1) => {
               return '"' + p1
                 .replace(/\n/g, "\\n")
                 .replace(/\r/g, "\\r")
                 .replace(/\t/g, "\\t")
                 .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                 + '"';
             });
             data = JSON.parse(fixedJson);
        }
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[getUpgradeSkills] Parsed data:', data);
        }
        
        return {
            currentStatus: data.currentStatus || {},
            upgradeSkills: data.upgradeSkills || []
        };
    } catch (error) {
        console.error('[getUpgradeSkills] Error:', error);
        console.error('[getUpgradeSkills] Error details:', error.message);
        
        // Fallback: Generate basic recommendations based on user context
        if (process.env.NODE_ENV === 'development') {
            console.log('[getUpgradeSkills] Generating fallback data...');
        }
        
        const fallbackData = {
            currentStatus: {
                role: userType === 'student' ? 'Student/Fresher' : 'Professional',
                experience: experience,
                primarySkill: specializationDisplay || industryDisplay,
                summary: userType === 'student' 
                    ? `Building foundation in ${specializationDisplay || industryDisplay} with strong potential for growth.`
                    : `${experience}+ years of experience in ${specializationDisplay || industryDisplay} with proven track record.`
            },
            upgradeSkills: userType === 'student'
                ? ['Data Structures & Algorithms', 'System Design Basics', 'Git & Version Control', 'Cloud Computing Fundamentals', 'Problem Solving']
                : experience < 3
                    ? ['Advanced System Design', 'Microservices Architecture', 'CI/CD Pipelines', 'Cloud Native Development', 'Leadership Skills']
                    : ['Technical Leadership', 'Architecture Patterns', 'Team Management', 'Strategic Planning', 'Mentoring & Coaching']
        };
        
        if (process.env.NODE_ENV === 'development') {
            console.log('[getUpgradeSkills] Returning fallback data:', fallbackData);
        }
        
        return fallbackData;
    }
}

export async function getIndustryInsights() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        return null;
    }

    if (!user.industry || !user.location) {
        return null; 
    }

    let industryInsight = await db.industryInsight.findUnique({
        where: {
            industry_location: {
                industry: user.industry,
                location: user.location,
            },
        },
    });

    if (!industryInsight) {
        const insights = await generateAIInsights(user.industry, user.location, user.userType === "student" ? "STUDENT" : "PROFESSIONAL", user.experience);
        
        if (!insights) {
            return null; 
        }

        industryInsight = await db.industryInsight.upsert({
            where: {
                industry_location: {
                    industry: user.industry,
                    location: user.location,
                },
            },
            update: {
                ...insights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            create: {
                industry: user.industry,
                location: user.location,
                ...insights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
    }

    return industryInsight;
}