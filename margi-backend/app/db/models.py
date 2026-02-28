from sqlalchemy import Column, Integer, String,Float,Boolean,DateTime,JSON,Enum,ForeignKey,Index
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
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True , nullable=False)
    name = Column(String)
    imageUrl = Column(String)
    industry = Column(String)
    specialization = Column(String)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    bio = Column(String)
    experience = Column(Integer)
    skills = Column(ARRAY(String))
    branch = Column(String)
    college = Column(String)
    plan = Column(String,default="FREE")
    monthlyUsage = Column(JSONB,default={"resume":0,"coverLetter":0,"interview":0,"voiceInterview":0})


    assessments = relationship("Assessment", back_populates="user")
    resumes = relationship("Resume", back_populates="user")


class JobApplication(Base):
    __tablename__ = "JobApplication"
    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("users.id"))
    jobTitle = Column(String)
    employerName = Column(String)
    status = Column(String)
    appliedAt = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="jobApplications")
       
class Resume(Base):
    __tablename__ = "Resume"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("users.id"))
    content = Column(String)
    atsScore = Column(Float)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resumes")

    
        
    

