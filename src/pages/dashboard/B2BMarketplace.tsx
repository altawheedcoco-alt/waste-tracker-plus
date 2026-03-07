import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Store, Search, Package, TrendingUp, Star, MapPin, Filter, ShoppingCart } from "lucide-react";

const B2BMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "الكل" },
    { id: "plastic", name: "بلاستيك مُعاد" },
    { id: "metal", name: "معادن" },
    { id: "paper", name: "ورق وكرتون" },
    { id: "glass", name: "زجاج" },
    { id: "organic", name: "سماد عضوي" },
  ];

  const listings = [
    {
      id: "1", title: "حبيبات PET معاد تدويرها - درجة أولى", seller: "مصنع النيل للتدوير",
      location: "القاهرة", price: 18500, unit: "طن", minOrder: 5, available: 50,
      category: "plastic", rating: 4.8, reviews: 24, verified: true,
      specs: ["نقاء 98%", "شفاف", "مطابق لـ FDA"],
    },
    {
      id: "2", title: "خردة حديد نظيفة - HMS 1&2", seller: "شركة المعادن المتحدة",
      location: "الإسكندرية", price: 22000, unit: "طن", minOrder: 10, available: 200,
      category: "metal", rating: 4.5, reviews: 18, verified: true,
      specs: ["HMS 1: 60%", "HMS 2: 40%", "خالي من الشوائب"],
    },
    {
      id: "3", title: "لب ورق كرتون معاد التصنيع", seller: "الشركة العربية للورق",
      location: "العاشر من رمضان", price: 8500, unit: "طن", minOrder: 3, available: 30,
      category: "paper", rating: 4.2, reviews: 11, verified: false,
      specs: ["OCC Grade", "رطوبة < 12%", "خالي من البلاستيك"],
    },
    {
      id: "4", title: "كسر زجاج شفاف مغسول", seller: "مدورة للزجاج",
      location: "6 أكتوبر", price: 3200, unit: "طن", minOrder: 2, available: 15,
      category: "glass", rating: 4.6, reviews: 8, verified: true,
      specs: ["شفاف 100%", "مغسول", "حجم < 5سم"],
    },
    {
      id: "5", title: "سماد عضوي فاخر من مخلفات الطعام", seller: "جرين كومبوست",
      location: "الفيوم", price: 1500, unit: "طن", minOrder: 1, available: 100,
      category: "organic", rating: 4.9, reviews: 32, verified: true,
      specs: ["NPK متوازن", "خالي من الملوثات", "شهادة عضوية"],
    },
  ];

  const filteredListings = listings.filter(l => {
    const matchesCategory = selectedCategory === "all" || l.category === selectedCategory;
    const matchesSearch = l.title.includes(searchQuery) || l.seller.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const marketStats = [
    { label: "إجمالي المنتجات", value: "1,247", icon: Package },
    { label: "البائعون النشطون", value: "89", icon: Store },
    { label: "صفقات هذا الشهر", value: "156", icon: ShoppingCart },
    { label: "متوسط التقييم", value: "4.6 ⭐", icon: Star },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Store className="h-7 w-7 text-primary" />
          سوق المواد المُعاد تدويرها B2B
        </h1>
        <p className="text-muted-foreground mt-1">منصة تداول المواد الخام المعاد تدويرها بين الشركات</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {marketStats.map((s, i) => (
          <Card key={i}><CardContent className="p-3 text-center">
            <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج أو بائع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <Button
              key={c.id}
              size="sm"
              variant={selectedCategory === c.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredListings.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    {item.verified && <Badge className="bg-emerald-500 text-[10px]">موثق ✓</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{item.seller}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {item.specs.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl font-bold text-primary">{item.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground mr-1">ج.م / {item.unit}</span>
                </div>
                <div className="text-left text-sm text-muted-foreground">
                  <p>الحد الأدنى: {item.minOrder} {item.unit}</p>
                  <p>متاح: {item.available} {item.unit}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium text-foreground">{item.rating}</span>
                  <span className="text-muted-foreground">({item.reviews} تقييم)</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">تفاصيل</Button>
                  <Button size="sm">طلب عرض سعر</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default B2BMarketplace;
