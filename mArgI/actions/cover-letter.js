"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PLAN_LIMITS } from "@/lib/pricing";
import { generateInputHash } from "@/lib/helper";
import { sendAlert } from "@/lib/monitoring";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
});

export async function checkCoverLetterLimit() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const plan = user.plan || "FREE";
  const limit = PLAN_LIMITS[plan]?.coverLetter || PLAN_LIMITS.FREE.coverLetter;
  const currentUsage = user.monthlyUsage?.coverLetter || 0;

  if (currentUsage >= limit) {
     throw new Error("PLAN_LIMIT_EXCEEDED");
  }

  return { success: true };
}

export async function getUserCoverLetterStats() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const userId = session.user.id;

    const user = await db.user.findUnique({
        where: { id: userId }
    });

    if (!user) throw new Error("User not found");

    const plan = user.plan || "FREE";
    const limit = PLAN_LIMITS[plan]?.coverLetter || PLAN_LIMITS.FREE.coverLetter;
    const currentUsage = user.monthlyUsage?.coverLetter || 0;

    return {
        currentUsage,
        limit,
        canCreate: currentUsage < limit
    };
}

export async function generateCoverLetter(data) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      resume: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    }
  });

  if (!user) throw new Error("User not found");

  // Implement Caching
  // Hash inputs: jobTitle, companyName, jobDescription, and user's profile info that affects generation
  // Ideally we should also consider user's bio/skills if they change, but for now assuming data passed + user ID is enough context
  // or verifying if user details changed.
  // The prompt relies on user.industry, skills, bio, resume.content
  // So we must include them in hash to be correct.
  
  const hashString = JSON.stringify({
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      jobDescription: data.jobDescription,
      industry: user.industry,
      skills: user.skills,
      bio: user.bio,
      resumeContent: user.resume?.[0]?.content, // Assuming user.resume might be fetched improperly here? 
      // wait, user object above doesn't include 'resume'.
      // We need to fetch resume content to be safe or hash what we *have*.
      // But the prompt USES resume content. 'user.resume?.content' at line 89. 
      // The user fetch at line 17 does NOT include resume.
      // Wait, look at line 89 in original file: 'CANDIDATE'S RESUME... "${user.resume?.content}"'
      // If user.resume is missing, it is undefined.
      // I should double check if the user fetch includes it.
      // The original code:
      // const user = await db.user.findUnique({ where: { clerkUserId: userId } });
      // It does NOT include resume. 
      // So line 89 `user.resume?.content` would be undefined??
      // Let me re-read the original file content provided in Context.
      // Original Line 17: const user = await db.user.findUnique({ where: { clerkUserId: userId } });
      // Original Line 89: "${user.resume?.content}"
      // IF user fetch didn't include resume, this prompt was sending "undefined"!
      // That sounds like a BUG in the original code, or I missed something.
      // Ah, `checkCoverLetterLimit` is separate. `generateCoverLetter`...
      
      // Let's look at `generateCoverLetter` again.
      // It fetches user. It DOES NOT include resume.
      // So `user.resume` is undefined.
      // So the prompt has been generating without resume content?
      // Or maybe `db.user.findUnique` automatically fetches relations? No, it doesn't.
      // Effectively, `user.resume?.content` is undefined.
      // If so, the hash should also be undefined for that part.
      // I will implement accordingly to match current behavior, but also maybe fix it? 
      // User asked to implement caching, not fix bugs, but caching incorrect results is bad.
      // BUT if I fix it, the hash will change from "undefined" to "content".
      // I will include what is available.
      
      // Additional note: The `user.resume` usage in prompt seems to imply it WAS expected. 
      // If I add `include: { resume: true }` (or similar), I might fix it. 
      // But for now, I will hash based on available data to be safe.
  });

  const inputHash = generateInputHash(hashString);

  // Check for existing text with same hash
  const existingLetter = await db.coverLetter.findFirst({
      where: {
          userId: user.id,
          inputHash: inputHash
      }
  });

  if (existingLetter) {
       console.log("CACHE HIT: Returning existing cover letter");
       return existingLetter;
  }

  // Check Plan Limits (only if not cached)
  const plan = user.plan || "FREE";
  const limit = PLAN_LIMITS[plan]?.coverLetter || PLAN_LIMITS.FREE.coverLetter;
  const currentUsage = user.monthlyUsage?.coverLetter || 0;

  if (currentUsage >= limit) {
    throw new Error("PLAN_LIMIT_EXCEEDED");
  }

  // --- QUOTA ALERT ---
  // Alert if usage hits 80% (just a warning, not blocking)
  if (currentUsage + 1 >= limit * 0.8 && limit > 0) {
      sendAlert(`⚠️ High Usage Alert: User ${user.email} (ID: ${user.id}) hit ${(currentUsage + 1)/limit * 100}% of cover letter limit`, {
          userId: user.id,
          email: user.email,
          currentUsage: currentUsage + 1,
          limit: limit,
          plan: plan,
          context: 'cover_letter_quota'
      }).catch(e => console.error("Quota alert failed", e));
  }

  // --- ESCROW LOCK ---
  await db.user.update({
    where: { id: user.id },
    data: {
        monthlyUsage: {
            ...user.monthlyUsage,
            coverLetter: currentUsage + 1
        }
    }
  });

  try {
    const prompt = `
      JOB DETAILS:
      - Position: ${data.jobTitle}
      - Company: ${data.companyName}
      - Description: ${data.jobDescription}

      CANDIDATE PROFILE:
      - Industry: ${user.industry}
      - Years of Experience: ${user.experience || "Entry Level"}
      - Skills: ${user.skills?.length ? user.skills.join(", ") : "General"}
      - Bio: ${user.bio || ""}
      ${user.resume?.[0]?.content ? `- Resume Content: ${user.resume[0].content}` : ""}

      INSTRUCTIONS:
      Write a professional, compelling cover letter for the above job position.
      
      GUIDELINES:
      1. **Tone**: Professional, confident, and tailored to the company culture (implied by the industry).
      2. **Structure**: 
         - Opening: Hook the reader, mention the specific role.
         - Body Paragraphs: Connect the candidate's specific skills/resume achievements to the job description requirements. Use specific examples from the provided resume content if available.
         - Closing: Reiterate enthusiasm and call to action (interview request).
      3. **Formatting**: Use Markdown.
      4. **Output Constraint**: 
         - RETURN ONLY THE COVER LETTER CONTENT.
         - DO NOT include introductory text like "Here is your cover letter" or "Sure, I can help".
         - DO NOT include placeholders like "[Your Name]" or "[Phone Number]" if the data is not provided; instead, use generic placeholders like "[Candidate Name]" ONLY if absolutely necessary, but preferably write it such that it doesn't look like a template.
         - The output must be ready to copy-paste.

      OUTPUT:
    `;

    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        userId: user.id,
        inputHash, // Save hash
      },
    });

    return coverLetter;
  } catch (error) {
    // --- REFUND ON FAILURE ---
    const currentUser = await db.user.findUnique({
        where: { id: user.id },
        select: { monthlyUsage: true }
    });
    const usage = currentUser?.monthlyUsage || {};
    await db.user.update({
        where: { id: user.id },
        data: {
            monthlyUsage: {
                ...usage,
                coverLetter: Math.max(0, (usage.coverLetter || 1) - 1)
            }
        }
    });
    console.error("Error generating cover letter:", error.message);
    
    // --- GEMINI FAILURE ALERT ---
    await sendAlert(`Gemini API Failed in generateCoverLetter`, {
        error: error.message,
        context: 'cover_letter_generation'
    });

    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
    resume: true, 
  },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}