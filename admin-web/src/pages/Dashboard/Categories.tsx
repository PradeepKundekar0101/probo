import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import useAxios from '@/hooks/use-axios';
import { Category } from '@/types/data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CustomLayout from "@/layout/CustomLayout";
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Upload } from 'lucide-react';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Categories = () => {
    const api = useAxios();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [categoryTitle, setCategoryTitle] = useState("");
    const [icon, setIcon] = useState<File | null>(null);
    const { toast } = useToast();

    const {
        data: categoriesData,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            return (await api.get("/market/getCategories")).data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!icon || !categoryTitle.trim()) {
                throw new Error("Please provide both category title and icon");
            }

            const formData = new FormData();
            formData.append("categoryName", categoryTitle.trim());
            formData.append("image", icon);

            return api.post("/market/createCategory", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },
        onSuccess: () => {
            setCategoryTitle("");
            setIcon(null);
            setIsOpen(false);
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            toast({
                title: "Success",
                description: "Category created successfully",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to create category",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIcon(e.target.files[0]);
        }
    };

    return (
        <CustomLayout>
            <section className="w-[80%]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-left mb-2">Markets</h1>
                        <p className="text-sm text-muted-foreground">
                            Create and manage prediction markets
                        </p>
                    </div>
                    <Drawer open={isOpen} onOpenChange={setIsOpen}>
                        <DrawerTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Category
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <form onSubmit={handleSubmit}>
                                <DrawerHeader>
                                    <DrawerTitle>Create a new category</DrawerTitle>
                                    <DrawerDescription>
                                        Fill in the details to create a new market category.
                                    </DrawerDescription>
                                </DrawerHeader>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Category title*</Label>
                                        <Input
                                            id="title"
                                            placeholder="Enter category title"
                                            value={categoryTitle}
                                            onChange={(e) => setCategoryTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="icon">Category Icon*</Label>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="icon"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => document.getElementById('icon')?.click()}
                                                className="w-full"
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                {icon ? icon.name : 'Upload Icon'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <DrawerFooter>
                                    <Button 
                                        type="submit" 
                                        disabled={createMutation.isPending || !categoryTitle.trim() || !icon}
                                    >
                                        {createMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Create Category
                                    </Button>
                                    <DrawerClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DrawerClose>
                                </DrawerFooter>
                            </form>
                        </DrawerContent>
                    </Drawer>
                </div>
                
                {isError && (
                    <div className="text-red-500 my-4">
                        Error loading categories: {error.message}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="flex justify-center my-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Icon</TableHead>
                                <TableHead>Category Name</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categoriesData?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">
                                        No categories found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categoriesData?.data?.map((category: Category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <img 
                                                src={category.icon}
                                                alt={category.categoryName}
                                                className="h-12 w-12 object-cover rounded-lg"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {category.categoryName}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                View Markets
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </section>
        </CustomLayout>
    );
};

export default Categories;