"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import NewSeriesModal from "./new-series-modal";
import EditSeriesModal from "./edit-series-modal";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminSeries() {
    const [series, setSeries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSeries, setEditingSeries] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Delete Confirmation State
    const [deletingSeries, setDeletingSeries] = useState<any | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchSeries = () => {
        setLoading(true);
        fetch("/api/v1/master/series")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSeries(data);
            })
            .catch(err => {
                toast.error("Failed to fetch series");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSeries();
    }, []);

    const handleConfirmDelete = async () => {
        if (!deletingSeries) return;
        try {
            const res = await fetch(`/api/v1/master/series/${deletingSeries.id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Series deleted successfully");
                setIsDeleteDialogOpen(false);
                setDeletingSeries(null);
                fetchSeries();
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.error || "Failed to delete series");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred while deleting");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-secondary/20">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Series</h1>
                    <p className="text-muted-foreground mt-1">Manage series and their association with brands.</p>
                </div>
                <NewSeriesModal onSuccess={fetchSeries} />
            </div>

            <Card className="shadow-sm border-secondary/20 border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-secondary/30">
                            <TableRow>
                                <TableHead className="font-semibold px-6 w-[100px]">Icon</TableHead>
                                <TableHead className="font-semibold">Series Name</TableHead>
                                <TableHead className="font-semibold">Brands</TableHead>
                                <TableHead className="text-right font-semibold px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Loading series...</TableCell>
                                </TableRow>
                            ) : series.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No series found. Add your first series.</TableCell>
                                </TableRow>
                            ) : (
                                series.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-secondary/10 transition-colors">
                                        <TableCell className="px-6">
                                            {s.iconUrl ? (
                                                <div className="w-10 h-10 rounded-md border overflow-hidden bg-white">
                                                    <img src={getImageUrl(s.iconUrl)} alt={s.name} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-md border bg-secondary/20 flex items-center justify-center text-[10px] text-muted-foreground">
                                                    No Icon
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-primary">{s.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{s.brandNames || "N/A"}</TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-primary hover:bg-primary/10 mr-2"
                                                onClick={() => {
                                                    setEditingSeries(s);
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
                                                    setDeletingSeries(s);
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

            <EditSeriesModal
                series={editingSeries}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                onSuccess={fetchSeries}
            />

            {/* Custom Delete Confirmation Modal */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Series</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deletingSeries?.name}</strong>? This action cannot be undone.
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
