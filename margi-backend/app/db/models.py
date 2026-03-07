from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Enum, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from .base import Base
import datetime
import enum
import uuid

class DemandLevel(enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    
class MarketOutlook(enum.Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"

class User(Base):
    __tablename__ = "User"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    imageUrl = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    bio = Column(String, nullable=True)
    experience = Column(Integer, nullable=True)
    skills = Column(ARRAY(String), default=[])
    branch = Column(String, nullable=True)
    college = Column(String, nullable=True)
    
    # Missing fields from Prisma
    currentPeriodEnd = Column(DateTime, nullable=True)
    currentYear = Column(Integer, nullable=True)
    degree = Column(String, nullable=True)
    graduationYear = Column(Integer, nullable=True)
    isGraduated = Column(Boolean, nullable=True)
    location = Column(String, nullable=True)
    monthlyUsage = Column(JSONB, default={"resume": 0, "interview": 0, "coverLetter": 0, "voiceInterview": 0})
    plan = Column(String, default="FREE")
    razorpayCustomerId = Column(String, nullable=True)
    razorpaySubscriptionId = Column(String, unique=True, nullable=True)
    userType = Column(String, nullable=True)
    password = Column(String, nullable=True)
    
    bannedAt = Column(DateTime, nullable=True)
    failedLoginAttempts = Column(Integer, default=0)
    lastLogin = Column(DateTime, nullable=True)
    referralCode = Column(String, nullable=True)
    weakAreas = Column(ARRAY(String), default=[])
    learnabilityScore = Column(Float, nullable=True)
    decisionQuality = Column(JSONB, nullable=True)
    actionCount = Column(Integer, default=0)
    secretInsight = Column(String, nullable=True)

    # Relationships
    assessments = relationship("Assessment", back_populates="user")
    resumes = relationship("Resume", back_populates="user")
    voiceAssessments = relationship("VoiceAssessment", back_populates="user")
    voiceQuestionPools = relationship("VoiceQuestionPool", back_populates="user")
    milestones = relationship("CareerMilestone", back_populates="user")
    badges = relationship("VerificationBadge", back_populates="user")
    jobApplications = relationship("JobApplication", back_populates="user")
    coverLetters = relationship("CoverLetter", back_populates="user")
    jobDrafts = relationship("JobDraft", back_populates="user")
    screenings = relationship("JobScreening", back_populates="user")
    quizPools = relationship("QuizPool", back_populates="user")
    interviews = relationship("Interview", back_populates="user")

class JobApplication(Base):
    __tablename__ = "JobApplication"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    jobId = Column(String, nullable=False)
    jobTitle = Column(String, nullable=False)
    employerName = Column(String, nullable=False)
    employerLogo = Column(String, nullable=True)
    jobApplyLink = Column(String, nullable=True)
    resumeId = Column(String, ForeignKey("Resume.id"), nullable=True)
    status = Column(String, default="applied")
    appliedAt = Column(DateTime, default=datetime.datetime.utcnow)
    analysis = Column(JSONB, nullable=True)
    feedback = Column(String, nullable=True)
    isVetted = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="jobApplications")
    resume = relationship("Resume", back_populates="applications")

class Assessment(Base):
    __tablename__ = "Assessment"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    quizScore = Column(Float, nullable=False)
    questions = Column(JSONB, nullable=False)
    category = Column(String, nullable=False)
    improvementTip = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    interviewType = Column(String, default="Technical")
    inputHash = Column(String, nullable=True)
    
    user = relationship("User", back_populates="assessments")

class VoiceAssessment(Base):
    __tablename__ = "VoiceAssessment"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    quizScore = Column(Float, nullable=False)
    questions = Column(JSONB, nullable=False)
    category = Column(String, default="Voice")
    improvementTip = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    inputHash = Column(String, nullable=True)
    
    user = relationship("User", back_populates="voiceAssessments")

class Resume(Base):
    __tablename__ = "Resume"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    content = Column(String, nullable=False)
    atsScore = Column(Float, nullable=True)
    feedback = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    inputHash = Column(String, nullable=True)
    title = Column(String, default="My Resume")
    fileUrl = Column(String, nullable=True)
    
    user = relationship("User", back_populates="resumes")
    applications = relationship("JobApplication", back_populates="resume")

class CoverLetter(Base):
    __tablename__ = "CoverLetter"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    content = Column(String, nullable=False)
    jobDescription = Column(String, nullable=True)
    companyName = Column(String, nullable=False)
    jobTitle = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    inputHash = Column(String, nullable=True)
    status = Column(String, default="generated")
    
    user = relationship("User", back_populates="coverLetters")

class QuizPool(Base):
    __tablename__ = "QuizPool"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    interviewType = Column(String, nullable=False)
    questions = Column(JSONB, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="quizPools")

class VoiceQuestionPool(Base):
    __tablename__ = "VoiceQuestionPool"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    industry = Column(String, nullable=False)
    questions = Column(JSONB, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="voiceQuestionPools")

class IndustryInsight(Base):
    __tablename__ = "IndustryInsight"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    industry = Column(String, index=True, nullable=False)
    salaryRanges = Column(JSONB, nullable=True)
    growthRate = Column(Float, nullable=False)
    demandLevel = Column(String, nullable=False)
    topSkills = Column(ARRAY(String), default=[])
    marketOutlook = Column(String, nullable=False)
    keyTrends = Column(ARRAY(String), default=[])
    recommendedSkills = Column(ARRAY(String), default=[])
    lastUpdated = Column(DateTime, default=datetime.datetime.utcnow)
    nextUpdate = Column(DateTime, nullable=True)
    location = Column(String, nullable=False)
    salaryCurrency = Column(String, default="INR")
    salaryFrequency = Column(String, default="Lakhs")
    
    __table_args__ = (UniqueConstraint('industry', 'location', name='_industry_location_uc'),)

class JobCache(Base):
    __tablename__ = "JobCache"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    industry = Column(String, nullable=False)
    location = Column(String, nullable=False)
    data = Column(JSONB, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('industry', 'location', name='_job_cache_uc'),)

class JobPost(Base):
    __tablename__ = "JobPost"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    url = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    screenings = relationship("JobScreening", back_populates="job")

class JobScreening(Base):
    __tablename__ = "JobScreening"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    jobId = Column(String, ForeignKey("JobPost.id"), nullable=False)
    score = Column(Float, nullable=False)
    passed = Column(Boolean, default=False)
    transcript = Column(JSONB, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="screenings")
    job = relationship("JobPost", back_populates="screenings")

class JobDraft(Base):
    __tablename__ = "JobDraft"
    __tablename__ = "JobDraft"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    jobId = Column(String, nullable=False)
    jobTitle = Column(String, nullable=False)
    company = Column(String, nullable=False)
    jobUrl = Column(String, nullable=True)
    matchScore = Column(Float, nullable=False)
    explanation = Column(String, nullable=True)
    status = Column(String, default="DRAFT")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="jobDrafts")

class CareerMilestone(Base):
    __tablename__ = "CareerMilestone"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    week = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    status = Column(String, default="PENDING")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="milestones")

class Interview(Base):
    __tablename__ = "Interview"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    deltaScore = Column(Float, nullable=True)
    learnabilityScore = Column(Float, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="interviews")

class VerificationBadge(Base):
    __tablename__ = "VerificationBadge"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"), nullable=False)
    uniqueShareableId = Column(String, unique=True, index=True, nullable=False)
    percentileRank = Column(Float, nullable=False)
    roleNiche = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="badges")
    __table_args__ = (UniqueConstraint('userId', 'roleNiche', name='_user_role_niche_uc'),)

class VerificationCode(Base):
    __tablename__ = "VerificationCode"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False)
    code = Column(String, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('email', 'code', name='_email_code_uc'),)

class PasswordResetToken(Base):
    __tablename__ = "PasswordResetToken"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

class ProcessedWebhook(Base):
    __tablename__ = "ProcessedWebhook"
    id = Column(String, primary_key=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)