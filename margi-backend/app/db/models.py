from sqlalchemy import Column, Integer, String,Float,Boolean,DateTime,JSON,Enum,ForeignKey,Index,UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID,ARRAY,JSONB
from sqlalchemy.orm import relationship
from .base import Base
import datetime
import enum
import uuid


class DemandLevel(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    
class MarketOutlook(enum.Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"

class User(Base):
    __tablename__ = "User"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True , nullable=False)
    name = Column(String)
    imageUrl = Column(String)
    industry = Column(String)
    specialization = Column(String)
    onboarded = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    bio = Column(String)
    experience = Column(Integer)
    skills = Column(ARRAY(String))
    branch = Column(String)
    college = Column(String)
    plan = Column(String,default="FREE")
    monthlyUsage = Column(JSONB,default={"resume":0,"coverLetter":0,"interview":0,"voiceInterview":0})
    learnabilityScore = Column(Float, default=0.0)
    actionCount = Column(Integer, default=0)
    lastLogin = Column(DateTime, default=datetime.datetime.utcnow)
    bannedAt = Column(DateTime, nullable=True)
    failedLoginAttempts = Column(Integer, default=0)
    referralCode = Column(String, nullable=True)
    weakAreas = Column(ARRAY(String), default=[])
    decisionQuality = Column(JSONB, default={})
    secretInsight = Column(String, nullable=True)

    assessments = relationship("Assessment", back_populates="user")
    resumes = relationship("Resume", back_populates="user")
    voiceAssessments = relationship("VoiceAssessment", back_populates="user")
    voiceQuestionPools = relationship("VoiceAssessmentPool", back_populates="user")
    milestones = relationship("CareerMilestone", back_populates="user")
    badges = relationship("VerificationBadge", back_populates="user")
    jobApplications = relationship("JobApplication", back_populates="user")


class JobApplication(Base):
    __tablename__ = "JobApplication"
    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"))
    jobTitle = Column(String)
    employerName = Column(String)
    status = Column(String)
    appliedAt = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="jobApplications")
       
class Resume(Base):
    __tablename__ = "Resume"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"))
    content = Column(String)
    atsScore = Column(Float)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resumes")


class Assessment(Base):
    __tablename__ = "Assessment"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"))
    quizScore = Column(Float)
    questions = Column(JSON)
    category = Column(String)
    improvementTip = Column(String, nullable=True)
    interviewType = Column(String, default="Technical")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User" , back_populates="assessments")


class QuizPool(Base):
    __tablename__="QuizPool"
    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"))
    interviewType = Column(String)
    questions = Column(JSON)
    updatedAt = Column(DateTime, onupdate = datetime.datetime.utcnow)

class Interview(Base):
    __tablename__ = "Interview"
    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id"))
    deltaScore = Column(Float, nullable=True)
    learnabilityScore = Column(Float, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

class VoiceAssessment(Base):
    __tablename__="VoiceAssessment"

    id= Column(String, primary_key=True,default=lambda: str(uuid.uuid4()))
    userId = Column(String,ForeignKey("User.id"))
    quizScore = Column(Float)
    questions = Column (JSON)
    category = Column(String,default="Voice")
    improvementTip = Column(String,nullable=True)
    createdAt = Column(DateTime,default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime,default=datetime.datetime.utcnow)

    user =  relationship("User" , back_populates="voiceAssessments")

class VoiceAssessmentPool(Base):
    __tablename__="VoiceQuestionPool"

    id = Column(String, primary_key=True, default=lambda:str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"))
    industry= Column(String)
    questions = Column(JSON)
    createdAt =Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="voiceQuestionPools")

class IndustryInsight(Base):
    __tablename__="IndustryInsight"

    id = Column(String, primary_key=True)
    industry = Column(String,index=True)
    salaryRanges = Column(JSONB)
    growthRate = Column(Float)
    demandLevel = Column(String)
    topSkills = Column(ARRAY(String))
    marketOutlook = Column(String)
    keyTrends = Column(ARRAY(String))
    recommendedSkills = Column(ARRAY(String))
    lastUpdated = Column(DateTime,default=datetime.datetime.utcnow)
    nextUpdate = Column(DateTime)
    location = Column(String)
    salaryCurrency =  Column(String,default="INR")
    salaryFrequency = Column(String,default="Lakhs")

    __table_args__= (UniqueConstraint('industry','location',name='_industry_location_uc'),)


class JobCache(Base):
    __tablename__="JobCache"


    id = Column(String, primary_key=True)
    industry = Column(String)
    location = Column(String)
    data = Column(JSON)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, onupdate=datetime.datetime.utcnow)

    __table_args__=(UniqueConstraint('industry' ,'location', name='_job_cache_uc'),)

class CareerMilestone(Base):
    __tablename__ ="CareerMilestone"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String,ForeignKey("User.id"))
    week = Column(Integer)
    title = Column(String)
    content = Column(String)
    status = Column(String, default="PENDING")
    createdAt=Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User",back_populates="milestones")

class VerificationBadge(Base):

    __tablename__="VerificationBadge"

    id= Column(String,primary_key=True, default=lambda: str(uuid.uuid4()))
    userId = Column(String, ForeignKey("User.id"))
    uniqueShareableId = Column(String , unique=True, index=True)
    percentileRank = Column(Float)
    roleNiche = Column(String)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default= datetime.datetime.utcnow)

    user = relationship("User", back_populates="badges")
    __table_args__ = (UniqueConstraint('userId','roleNiche',name='_user_role_niche_uc'),)

class ProcessedWebhook(Base):
    __tablename__="ProcessedWebhook"
    id =Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, index=True)
    code = Column(String)
    expiresAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

class PasswordResetToken(Base):
    __tablename__="PasswordResetToken"
    id = Column(String, primary_key=True, default=lambda:str(uuid.uuid4()))
    email = Column(String, index= True)
    token = Column(String, unique=True)
    expiresAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    
    