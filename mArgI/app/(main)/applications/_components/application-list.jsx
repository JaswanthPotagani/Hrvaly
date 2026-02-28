"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, FileText, Briefcase, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import StatusUpdateDialog from "./status-update-dialog";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/actions/application";

const statusColors = {
  applied: "bg-blue-100 text-blue-800 border-blue-200",
  interviewing: "bg-amber-100 text-amber-800 border-amber-200",
  hired: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function ApplicationList({ applications }) {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Quick status update for "Interviewing"
  const handleQuickStatus = async (id, status) => {
    await updateApplicationStatus(id, status);
    router.refresh();
  };

  if (!applications || applications.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Briefcase className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No applications yet</h3>
            <p className="max-w-xs mt-2 text-sm">Start applying to jobs via the &quot;Jobs&quot; tab to track them here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Application History</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Role & Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Applied Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {app.employerLogo ? (
                        <Image src={app.employerLogo} alt={app.employerName} width={40} height={40} className="h-10 w-10 rounded-md object-contain bg-muted" />
                    ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Briefcase className="h-5 w-5 opacity-50" />
                        </div>
                    )}
                    <div>
                        <div className="font-medium">{app.jobTitle}</div>
                        <div className="text-sm text-muted-foreground">{app.employerName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize ${statusColors[app.status] || "bg-secondary"}`}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                   {format(new Date(app.appliedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {app.status === "applied" && (
                         <DropdownMenuItem onClick={() => handleQuickStatus(app.id, "interviewing")}>
                            Mark Interviewing
                         </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => {
                        setSelectedApp(app);
                        setIsDialogOpen(true);
                      }}>
                        Update Status
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <StatusUpdateDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        application={selectedApp}
        onSuccess={() => router.refresh()}
    />
    </>
  );
}
