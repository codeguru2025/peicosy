import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAdminDashboard, useAdminOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useExchangeRate, useUpdateExchangeRate, formatZAR } from "@/hooks/use-shipping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, Package, AlertCircle, Plus, Pencil, Trash2, Eye, Check, Settings, Download, FileSpreadsheet, TrendingUp, Users, ShoppingBag, BarChart3, PieChart, ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminDashboard();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-8 py-16 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-primary"></div>
          <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Management</span>
        </div>
        <h1 className="font-serif text-5xl font-light mb-12 tracking-tight text-secondary">Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl text-[10px] uppercase tracking-[0.3em] font-bold px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl text-[10px] uppercase tracking-[0.3em] font-bold px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm" data-testid="tab-products">
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl text-[10px] uppercase tracking-[0.3em] font-bold px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm" data-testid="tab-orders">
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl text-[10px] uppercase tracking-[0.3em] font-bold px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm" data-testid="tab-settings">
              Settings
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl text-[10px] uppercase tracking-[0.3em] font-bold px-6 py-3 data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm" data-testid="tab-reports">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <OverviewTab stats={stats} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="products" className="space-y-8">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-8">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="reports" className="space-y-8">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}

function OverviewTab({ stats, isLoading }: { stats: any, isLoading: boolean }) {
  return (
    <>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
          <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
          <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Revenue" 
            value={`£${(stats?.totalRevenue || 0).toFixed(2)}`} 
            icon={DollarSign} 
            description="Across all orders"
          />
          <StatCard 
            title="Active Orders" 
            value={stats?.activeOrders || 0} 
            icon={Package} 
            description="Orders in progress"
          />
          <StatCard 
            title="Pending Verification" 
            value={stats?.pendingVerifications || 0} 
            icon={AlertCircle} 
            description="Payments needing review"
            alert={(stats?.pendingVerifications ?? 0) > 0}
          />
        </div>
      )}

      <Card className="border-border shadow-lg">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="font-serif text-xl font-light text-secondary mb-2">Detailed Analytics</h3>
          <p className="text-muted-foreground mb-4">View comprehensive reports, revenue trends, and export data</p>
          <Button 
            variant="outline" 
            className="rounded-full px-6 text-[10px] uppercase tracking-[0.3em] font-bold"
            onClick={() => document.querySelector('[data-testid="tab-reports"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
            data-testid="button-view-reports"
          >
            View Reports
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

function ProductsTab() {
  const { data: products, isLoading } = useProducts({});
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const { toast } = useToast();

  const addImageToProduct = useMutation({
    mutationFn: async ({ productId, image }: { productId: number; image: UploadedImage }) => {
      return apiRequest(`/api/products/${productId}/images`, {
        method: 'POST',
        body: JSON.stringify({
          objectPath: image.objectPath,
          cdnUrl: image.cdnUrl,
          role: image.role,
          originalFilename: image.originalFilename,
          mimeType: image.mimeType,
          fileSize: image.fileSize,
          width: image.width,
          height: image.height,
        }),
      });
    },
  });

  const onSubmit = async (data: any) => {
    const imageUrl = productImages.length > 0 
      ? productImages.find(img => img.role === 'thumbnail')?.cdnUrl || productImages[0].cdnUrl 
      : data.imageUrl || 'https://placehold.co/400x400?text=No+Image';

    createProduct({
      brand: data.brand,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: "GBP",
      category: data.category,
      imageUrl: imageUrl,
      stock: parseInt(data.stock) || 0,
    }, {
      onSuccess: async (newProduct: any) => {
        if (productImages.length > 0 && newProduct?.id) {
          setIsUploadingImages(true);
          try {
            for (const image of productImages) {
              await addImageToProduct.mutateAsync({ productId: newProduct.id, image });
            }
            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
            toast({ title: "Success", description: "Product created with images" });
          } catch (err) {
            toast({ title: "Warning", description: "Product created but some images failed to save", variant: "destructive" });
          }
          setIsUploadingImages(false);
        }
        setIsAddOpen(false);
        setProductImages([]);
        reset();
      }
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setProductImages([]);
      reset();
    }
    setIsAddOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-2xl font-light text-secondary">Product Inventory</h2>
        <Dialog open={isAddOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full px-6 text-[10px] uppercase tracking-[0.3em] font-bold bg-primary hover:bg-primary/90 text-white" data-testid="button-add-product">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-light text-secondary">Add New Product</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Brand</Label>
                    <Input {...register("brand")} required className="rounded-xl" data-testid="input-brand" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Name</Label>
                    <Input {...register("name")} required className="rounded-xl" data-testid="input-name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Description</Label>
                  <Input {...register("description")} required className="rounded-xl" data-testid="input-description" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Price (£)</Label>
                    <Input {...register("price")} type="number" step="0.01" required className="rounded-xl" data-testid="input-price" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Category</Label>
                    <Input {...register("category")} required className="rounded-xl" data-testid="input-category" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Stock</Label>
                    <Input {...register("stock")} type="number" required className="rounded-xl" data-testid="input-stock" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Product Images
                  </Label>
                  <ImageUploader
                    images={productImages}
                    onImagesChange={setProductImages}
                    maxImages={10}
                  />
                </div>

                {productImages.length === 0 && (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground">Or use Image URL</Label>
                    <Input {...register("imageUrl")} className="rounded-xl" placeholder="https://..." data-testid="input-imageurl" />
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isCreating || isUploadingImages} 
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-white text-[10px] uppercase tracking-[0.3em] font-bold h-12" 
                  data-testid="button-submit-product"
                >
                  {isCreating || isUploadingImages ? "Adding..." : "Add Product"}
                </Button>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="space-y-4">
          {products?.map((product: any) => (
            <Card key={product.id} className="border-border shadow-sm hover:shadow-md transition-shadow" data-testid={`product-row-${product.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-primary uppercase tracking-[0.4em] font-bold">{product.brand}</p>
                    <p className="font-serif text-lg text-secondary truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category} • Stock: {product.stock}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl text-secondary">£{product.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="rounded-xl" data-testid={`button-edit-${product.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteProduct(product.id)}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = useAdminOrders();
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatus({ id: orderId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl font-light text-secondary">All Orders</h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      ) : orders?.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders?.map((order: any) => (
            <Card key={order.id} className="border-border shadow-sm hover:shadow-md transition-shadow" data-testid={`admin-order-${order.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em]">Order #{order.id}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="font-serif text-lg text-secondary mb-1">£{order.totalAmount}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' • '}{order.items?.length || 0} items
                    </p>
                    {order.proofOfPaymentUrl && (
                      <a href={order.proofOfPaymentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-2">
                        <Eye className="w-3 h-3" /> View Payment Proof
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Select 
                      value={order.status} 
                      onValueChange={(val) => handleStatusChange(order.id, val)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-48 rounded-xl" data-testid={`select-status-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending_payment">Pending Payment</SelectItem>
                        <SelectItem value="pending_verification">Pending Verification</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="arrived">Arrived in SA</SelectItem>
                        <SelectItem value="ready_collection">Ready for Collection</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {order.status === 'pending_verification' && (
                      <Button 
                        size="sm"
                        className="gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleStatusChange(order.id, 'confirmed')}
                        data-testid={`button-verify-${order.id}`}
                      >
                        <Check className="w-4 h-4" /> Verify
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { data: exchangeRateData, isLoading } = useExchangeRate();
  const { mutate: updateRate, isPending } = useUpdateExchangeRate();
  const [rate, setRate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (exchangeRateData?.rate) {
      setRate(exchangeRateData.rate.toString());
    }
  }, [exchangeRateData]);

  const handleUpdateRate = () => {
    if (!rate.trim()) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a value for the exchange rate.",
        variant: "destructive",
      });
      return;
    }
    const newRate = parseFloat(rate);
    if (isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Invalid Rate",
        description: "Please enter a valid positive number for the exchange rate.",
        variant: "destructive",
      });
      return;
    }
    updateRate(newRate, {
      onSuccess: () => {
        toast({
          title: "Exchange Rate Updated",
          description: `GBP to ZAR rate set to ${newRate.toFixed(2)}`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update exchange rate. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-8">
      <Card className="border-border shadow-lg">
        <CardHeader>
          <CardTitle className="font-serif font-light text-2xl text-secondary flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            Currency Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/30 border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <Label className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-2 block">
                  GBP to ZAR Exchange Rate
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Set the exchange rate used to convert product prices from British Pounds (GBP) to South African Rand (ZAR).
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-secondary">£1 =</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">R</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="pl-8 w-32 text-lg font-bold"
                        placeholder="23.50"
                        disabled={isLoading}
                        data-testid="input-exchange-rate"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleUpdateRate}
                    disabled={isPending || isLoading || !rate.trim() || isNaN(parseFloat(rate)) || parseFloat(rate) <= 0}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-update-rate"
                  >
                    {isPending ? "Updating..." : "Update Rate"}
                  </Button>
                </div>
              </div>
            </div>
            
            {exchangeRateData && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Current Rate:</span> £1 = R{exchangeRateData.rate.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Last updated: {exchangeRateData.updatedAt ? new Date(exchangeRateData.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-blue-800 mb-2">How this works</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Products are stored with prices in GBP (British Pounds)</li>
              <li>Customers see prices converted to ZAR using this exchange rate</li>
              <li>Shipping costs and duties are also converted to ZAR</li>
              <li>Update this rate regularly to reflect current market rates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <ImageMigrationCard />
    </div>
  );
}

function ImageMigrationCard() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ count: number } | null>(null);
  const { toast } = useToast();

  const handleMigrateAll = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    
    try {
      const response = await fetch('/api/admin/migrate-all-images', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Migration failed');
      
      const result = await response.json();
      setMigrationResult(result);
      
      toast({
        title: "Migration Complete",
        description: `Migrated ${result.count} product image(s) to the new system.`,
      });
    } catch (err) {
      toast({
        title: "Migration Failed",
        description: "Unable to migrate images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle className="font-serif font-light text-2xl text-secondary flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-primary" />
          Product Image Migration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 border border-border rounded-2xl p-6">
          <p className="text-sm text-muted-foreground mb-4">
            This tool migrates existing product images from external URLs to the new multi-image system.
            Legacy images will be preserved and marked for easy identification.
          </p>
          
          <Button
            onClick={handleMigrateAll}
            disabled={isMigrating}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-migrate-images"
          >
            {isMigrating ? "Migrating..." : "Migrate All Product Images"}
          </Button>
          
          {migrationResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700">
                Successfully migrated {migrationResult.count} image(s) to the new system.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-amber-800 mb-2">About this migration</h3>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Existing product image URLs are converted to the new image system</li>
            <li>Migrated images are marked as "Legacy" for reference</li>
            <li>New products should use the drag-and-drop uploader</li>
            <li>This migration is safe to run multiple times</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsTab() {
  const { data: analytics, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
  });
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (entity: string, format: 'csv' | 'json') => {
    setIsExporting(`${entity}-${format}`);
    try {
      const response = await fetch(`/api/admin/export/${entity}?format=${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}-export-${new Date().toISOString().slice(0,10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `${entity} data exported as ${format.toUpperCase()}`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Unable to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const orderStatusData = analytics?.ordersByStatus 
    ? Object.entries(analytics.ordersByStatus).map(([name, value]) => ({ name, value }))
    : [];

  const shippingData = analytics?.shippingMethodDistribution
    ? Object.entries(analytics.shippingMethodDistribution).map(([name, value]) => ({ 
        name: name === 'air' ? 'Air Freight' : 'Sea Freight', 
        value 
      }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="font-serif text-2xl font-light text-secondary">Reports & Analytics</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={`£${(analytics?.totalRevenue || 0).toFixed(2)}`} 
              icon={DollarSign} 
              description="Lifetime revenue"
            />
            <StatCard 
              title="Total Orders" 
              value={analytics?.totalOrders || 0} 
              icon={ShoppingBag} 
              description="All time orders"
            />
            <StatCard 
              title="Avg Order Value" 
              value={`£${(analytics?.averageOrderValue || 0).toFixed(2)}`} 
              icon={TrendingUp} 
              description="Per order average"
            />
            <StatCard 
              title="Customers" 
              value={analytics?.customerCount || 0} 
              icon={Users} 
              description={`${(analytics?.repeatCustomerRate || 0).toFixed(0)}% repeat rate`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif font-light text-2xl text-secondary flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Revenue Trend (12 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.revenueByMonth || []}>
                    <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} 
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif font-light text-2xl text-secondary flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {orderStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No order data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif font-light text-2xl text-secondary">Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topProducts.slice(0, 5).map((product: any, i: number) => (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary w-6">{i + 1}.</span>
                          <div>
                            <p className="text-[9px] text-primary uppercase tracking-[0.3em] font-bold">{product.brand}</p>
                            <p className="text-sm font-medium text-secondary">{product.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-secondary">£{product.revenue.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{product.totalSold} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No sales data yet</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="font-serif font-light text-2xl text-secondary">Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {analytics?.topCategories?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.topCategories.slice(0, 6)} layout="vertical">
                      <XAxis type="number" fontSize={10} tickFormatter={(v) => `£${v}`} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="category" type="category" fontSize={10} width={80} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} 
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-serif font-light text-2xl text-secondary flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">Download your business data for offline analysis or record-keeping.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { entity: 'products', label: 'Products', icon: Package, description: 'All product catalog' },
                  { entity: 'orders', label: 'Orders', icon: ShoppingBag, description: 'Order history with items' },
                  { entity: 'users', label: 'Customers', icon: Users, description: 'Customer directory' },
                  { entity: 'transactions', label: 'Transactions', icon: DollarSign, description: 'Financial records' },
                ].map(({ entity, label, icon: Icon, description }) => (
                  <Card key={entity} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary">{label}</p>
                          <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleExport(entity, 'csv')}
                          disabled={isExporting === `${entity}-csv`}
                          data-testid={`button-export-${entity}-csv`}
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleExport(entity, 'json')}
                          disabled={isExporting === `${entity}-json`}
                          data-testid={`button-export-${entity}-json`}
                        >
                          <Download className="w-3 h-3" />
                          JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, alert }: any) {
  return (
    <Card className={`border-border shadow-lg ${alert ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${alert ? 'bg-primary/10' : 'bg-muted'}`}>
            <Icon className={`h-4 w-4 ${alert ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        <div className="text-3xl font-bold font-serif text-secondary">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_payment: "bg-primary/10 text-primary border-primary/30",
    pending_verification: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    confirmed: "bg-green-500/10 text-green-600 border-green-500/30",
    shipped: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    arrived: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
    ready_collection: "bg-orange-500/10 text-orange-600 border-orange-500/30",
    completed: "bg-secondary/10 text-secondary border-secondary/30",
  };

  const labels: Record<string, string> = {
    pending_payment: "Awaiting Payment",
    pending_verification: "Verifying",
    confirmed: "Confirmed",
    shipped: "In Transit",
    arrived: "Arrived in SA",
    ready_collection: "Ready",
    completed: "Completed"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border ${styles[status] || styles.completed}`}>
      {labels[status] || status}
    </span>
  );
}
