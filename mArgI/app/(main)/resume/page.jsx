import { getAllResumes, getUserResumeStats } from "@/actions/resume";
import ResumeList from "./_components/resume-list";
import AddResume from "./_components/add-resume";

const ResumePage = async () => {
    const resumes = await getAllResumes();
    const stats = await getUserResumeStats();

    return (
        <div className="container mx-auto py-12 px-4 space-y-8">
             <div className="flex flex-col md:flex-row justify-between items-center sm:gap-4">
                <div>
                   <h1 className="text-3xl font-bold gradient-title">My Resumes</h1>
                   <p className="text-muted-foreground mt-2">Manage and create multiple versions of your resume.</p>
                </div>
                <AddResume canCreate={stats.canCreate} />
             </div>

             <ResumeList resumes={resumes} />
        </div>
    );
};

export default ResumePage;
