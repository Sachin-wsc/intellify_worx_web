"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import NewBrandModal from "./new-brand-modal";
import EditBrandModal from "./edit-brand-modal";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminBrands() {
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBrand, setEditingBrand] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Delete Confirmation State
    const [deletingBrand, setDeletingBrand] = useState<any | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchBrands = () => {
        setLoading(true);
        fetch("/api/v1/master/brands")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBrands(data);
            })
            .catch(err => {
                toast.error("Failed to fetch brands");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleConfirmDelete = async () => {
        if (!deletingBrand) return;
        try {
            const res = await fetch(`/api/v1/master/brands/${deletingBrand.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Brand deleted successfully");
                setIsDeleteDialogOpen(false);
                setDeletingBrand(null);
                fetchBrands();
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || "Failed to delete brand");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while deleting");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-secondary/20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Brands</h1>
                    <p className="text-muted-foreground mt-1">Manage brands and their association with companies.</p>
                </div>
                <NewBrandModal onSuccess={fetchBrands} />
            </div>

            <Card className="shadow-sm border-secondary/20 border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow>
                                <TableHead className="font-semibold px-6 w-[100px]">Icon</TableHead>
                                <TableHead className="font-semibold">Brand Name</TableHead>
                                <TableHead className="font-semibold">Companies</TableHead>
                                <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Loading brands...</TableCell>
                                </TableRow>
                            ) : brands.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No brands found. Add your first brand.</TableCell>
                                </TableRow>
                            ) : (
                                brands.map((b) => (
                                    <TableRow key={b.id} className="hover:bg-secondary/10 transition-colors">
                                        <TableCell className="px-6">
                                            {b.iconUrl ? (
                                                <div className="w-10 h-10 rounded-md border overflow-hidden bg-white">
                                                    <img src={getImageUrl(b.iconUrl)} alt={b.name} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-md border bg-secondary/20 flex items-center justify-center text-[10px] text-muted-foreground">
                                                    No Icon
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-primary">{b.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{b.companyNames || "N/A"}</TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-primary hover:bg-primary/10 mr-2"
                                                onClick={() => {
                                                    setEditingBrand(b);
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
                                                    setDeletingBrand(b);
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

            <EditBrandModal
                brand={editingBrand}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={fetchBrands}
            />

            {/* Custom Delete Confirmation Modal */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Brand</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingBrand?.name}</strong>? This action cannot be undone.
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
