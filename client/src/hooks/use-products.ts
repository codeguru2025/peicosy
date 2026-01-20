import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProduct, type Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProducts(filters?: { category?: string; search?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.append("category", filters.category);
  if (filters?.search) queryParams.append("search", filters.search);

  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      const url = `${api.products.list.path}?${queryParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      // Ensure numeric/boolean conversions if needed, though zod handles type checks
      const res = await fetch(api.products.create.path, {
        method: api.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create product");
      }
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Product Created", description: "Successfully added new product." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertProduct> & { id: number }) => {
      const url = buildUrl(api.products.update.path, { id });
      const res = await fetch(url, {
        method: api.products.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update product");
      }
      return api.products.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Product Updated", description: "Changes saved successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, {
        method: api.products.delete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Product Deleted", description: "Product removed from catalog." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export interface ProductImage {
  id: number;
  productId: number;
  objectPath: string;
  cdnUrl: string;
  role: 'thumbnail' | 'hero' | 'gallery';
  originalFilename?: string;
  mimeType: string;
  fileSize?: number;
  width?: number;
  height?: number;
  sortOrder: number;
  isLegacy: boolean;
  createdAt: string;
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

export function useProductWithImages(id: number) {
  return useQuery<ProductWithImages>({
    queryKey: ['/api/products', id, 'with-images'],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}/with-images`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useProductImages(productId: number) {
  return useQuery<ProductImage[]>({
    queryKey: ['/api/products', productId, 'images'],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/images`);
      if (!res.ok) throw new Error("Failed to fetch product images");
      return res.json();
    },
    enabled: !!productId,
  });
}
