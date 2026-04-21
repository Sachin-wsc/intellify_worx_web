"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import NewCompanyModal from "./new-company-modal";
import EditCompanyModal from "./edit-company-modal";

import { getImageUrl } from "@/lib/image-utils";

export default function AdminCompanies() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCompany, setEditingCompany] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Delete Confirmation State
    const [deletingCompany, setDeletingCompany] = useState<any | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchCompanies = () => {
        setLoading(true);
        fetch("/api/v1/master/companies")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCompanies(data);
            })
            .catch(err => {
                toast.error("Failed to fetch companies");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleConfirmDelete = async () => {
        if (!deletingCompany) return;
        try {
            const res = await fetch(`/api/v1/master/companies/${deletingCompany.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Company deleted successfully");
                setIsDeleteDialogOpen(false);
                setDeletingCompany(null);
                fetchCompanies();
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || "Failed to delete company");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while deleting");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-secondary/20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Companies</h1>
                    <p className="text-muted-foreground mt-1">Manage the list of companies associated with products.</p>
                </div>
                <NewCompanyModal onSuccess={fetchCompanies} />
            </div>

            <Card className="shadow-sm border-secondary/20 border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow>
                                <TableHead className="font-semibold px-6 w-[100px]">Logo</TableHead>
                                <TableHead className="font-semibold">Company Name</TableHead>
                                <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">Loading companies...</TableCell>
                                </TableRow>
                            ) : companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No companies found. Add your first company.</TableCell>
                                </TableRow>
                            ) : (
                                companies.map((c) => (
                                    <TableRow key={c.id} className="hover:bg-secondary/10 transition-colors">
                                        <TableCell className="px-6">
                                            {c.logoUrl ? (
                                                <div className="w-10 h-10 rounded-md border overflow-hidden bg-white">
                                                    <img src={getImageUrl(c.logoUrl)} alt={c.name} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-md border bg-secondary/20 flex items-center justify-center text-[10px] text-muted-foreground">
                                                    No Logo
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-primary">{c.name}</TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-primary hover:bg-primary/10 mr-2"
                                                onClick={() => {
                                                    setEditingCompany(c);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    setDeletingCompany(c);
                                                    setIsDeleteDialogOpen(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <EditCompanyModal
                company={editingCompany}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={fetchCompanies}
            />

            {/* Custom Delete Confirmation Modal */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Company</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingCompany?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Yes, Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
