export function entriesToMarkdown(entries,type){
    if(!entries?.length) return "";

    return(
        `## ${type}\n\n` + 
        entries.map((entry)=>{
          const dateRange = entry.current ? `${entry.startDate} - Present` : `${entry.startDate} - ${entry.endDate}`;
          const separator = type.toLowerCase().includes('education') ? ', ' : ' @ ';
          return `### ${entry.title}${separator}${entry.organization}\n${dateRange}\n\n${entry.description}`;  
        }).join("\n\n")
    )
    
}