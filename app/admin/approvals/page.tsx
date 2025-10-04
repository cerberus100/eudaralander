"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";

interface ClinicianApplication {
  appId: string;
  fullName: string;
  email: string;
  phone: string;
  npi: string;
  states: string[];
  specialties: string[];
  pecosEnrolled: boolean;
  documents: {
    malpracticeKey?: string;
    deaKey?: string;
    extras?: string[];
  };
  createdAt: string;
}

export default function AdminApprovals() {
  const [applications, setApplications] = useState<ClinicianApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('https://eudaura.com/api/admin/clinician/apps?status=SUBMITTED');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        console.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    if (!confirm('Are you sure you want to approve this clinician application?')) {
      return;
    }

    try {
      const response = await fetch(`https://eudaura.com/api/admin/clinician/${appId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Application approved successfully!');
        await fetchApplications(); // Refresh the list
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve application', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const handleDeny = async (appId: string) => {
    if (!confirm('Are you sure you want to deny this clinician application?')) {
      return;
    }

    try {
      const response = await fetch(`https://eudaura.com/api/admin/clinician/${appId}/deny`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Application denied');
        await fetchApplications(); // Refresh the list
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deny application');
      }
    } catch (error) {
      console.error('Denial error:', error);
      toast.error('Failed to deny application', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground/70">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Clinician Applications
          </h1>
          <p className="text-foreground/70">
            Review and approve clinician applications
          </p>
        </div>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>
              {applications.length} application{applications.length !== 1 ? 's' : ''} awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Applications</h3>
                <p className="text-foreground/70">All clinician applications have been reviewed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NPI</TableHead>
                    <TableHead>States</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>PECOS</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.appId}>
                      <TableCell className="font-medium">{app.fullName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{app.npi}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://npiregistry.cms.hhs.gov/provider-view/${app.npi}`, '_blank')}
                            className="p-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {app.states.map((state) => (
                            <Badge key={state} variant="secondary" className="text-xs">
                              {state}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {app.specialties.slice(0, 2).map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {app.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.specialties.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.pecosEnrolled ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Not Enrolled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {app.documents.malpracticeKey && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                              License
                            </Badge>
                          )}
                          {app.documents.deaKey && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800 text-xs">
                              DEA
                            </Badge>
                          )}
                          {app.documents.extras && app.documents.extras.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{app.documents.extras.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground/70">
                        {formatDate(app.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(app.appId)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeny(app.appId)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

