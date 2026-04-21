"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";
import Select from "react-select";
import { getImageUrl } from "@/lib/image-utils";

interface EditBrandModalProps {
    brand: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditBrandModal({ brand, open, onOpenChange, onSuccess }: EditBrandModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [selectedCompanies, setSelectedCompanies] = useState<any[]>([]);
    const [icon, setIcon] = useState<File & { preview: string } | null>(null);
    const [existingIcon, setExistingIcon] = useState<string | null>(null);
    const [companies, setCompanies] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetch("/api/v1/master/companies")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const options = data.map(c => ({ value: c.id, label: c.name }));
                        setCompanies(options);
                        if (brand && brand.companies) {
                            const currentCompanies = options.filter(o => 
                                brand.companies.some((bc: any) => bc.id === o.value)
                            );
                            setSelectedCompanies(currentCompanies);
                        }
                    }
                })
                .catch(err => toast.error("Failed to load companies"));

            if (brand) {
                setName(brand.name || "");
                setExistingIcon(brand.iconUrl || null);
                setIcon(null);
            }
        }
    }, [open, brand]);

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setIcon(Object.assign(file, {
                preview: URL.createObjectURL(file)
            }));
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCompanies.length === 0) {
            toast.error("Please select at least one company");
            return;
        }
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("companyIds", JSON.stringify(selectedCompanies.map(c => c.value)));
            if (icon) {
                formData.append("icon", icon);
            }

            const res = await fetch(`/api/v1/master/brands/${brand.id}`, {
                method: "PATCH",
                body: formData,
            });

            if (res.ok) {
                toast.success("Brand updated successfully");
                onOpenChange(false);
                onSuccess();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to update brand");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!brand) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Edit Brand</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-company" className="text-secondary-foreground font-semibold">Select Companies <span className="text-red-500">*</span></Label>
                            <Select
                                isMulti
                                options={companies}
                                value={selectedCompanies}
                                onChange={(val: any) => setSelectedCompanies(val)}
                                placeholder="Select Companies..."
                                isSearchable
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-secondary-foreground font-semibold">Brand Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter brand name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-secondary-foreground font-semibold">Brand Icon</Label>
                            {icon ? (
                                <div className="relative w-32 h-32 mx-auto border rounded-lg overflow-hidden group">
                                    <img src={icon.preview} alt="Preview" className="w-full h-full object-contain" />
                                    <button
                                        type="button"
                                        onClick={() => setIcon(null)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : existingIcon ? (
                                <div className="relative w-32 h-32 mx-auto border rounded-lg overflow-hidden group">
                                    <img src={getImageUrl(existingIcon)} alt="Existing Icon" className="w-full h-full object-contain" />
                                    <div
                                        {...getRootProps()}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="text-white h-8 w-8" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setExistingIcon(null)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600">Drag & drop brand icon here, or click to select</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
