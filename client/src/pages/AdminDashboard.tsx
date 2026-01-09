import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAdminDashboard } from "@/hooks/use-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Package, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminDashboard();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-8 py-16 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] w-12 bg-primary"></div>
          <span className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold">Management</span>
        </div>
        <h1 className="font-serif text-5xl font-light mb-12 tracking-tight text-secondary">Admin Dashboard</h1>

        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
             <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
             <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard 
              title="Total Revenue" 
              value={`£${stats?.totalRevenue || 0}`} 
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
              alert={stats?.pendingVerifications > 0}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="border-border shadow-lg">
             <CardHeader>
               <CardTitle className="font-serif font-light text-2xl text-secondary">Revenue Overview</CardTitle>
             </CardHeader>
             <CardContent className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                   { name: 'Mon', total: 1200 },
                   { name: 'Tue', total: 900 },
                   { name: 'Wed', total: 1600 },
                   { name: 'Thu', total: 1400 },
                   { name: 'Fri', total: 2100 },
                   { name: 'Sat', total: 1800 },
                   { name: 'Sun', total: 1000 },
                 ]}>
                   <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                   <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} stroke="hsl(var(--muted-foreground))" />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'hsl(var(--background))', 
                       border: '1px solid hsl(var(--border))',
                       borderRadius: '0.75rem'
                     }} 
                   />
                   <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>

           <Card className="border-border shadow-lg">
             <CardHeader>
               <CardTitle className="font-serif font-light text-2xl text-secondary">Recent Activity</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors duration-300">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium text-secondary">New order received</span>
                      <span className="text-muted-foreground ml-auto">2 mins ago</span>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
      
      <Footer />
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
