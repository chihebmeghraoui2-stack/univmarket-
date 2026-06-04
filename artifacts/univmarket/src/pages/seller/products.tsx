import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import WilayaSelector from "@/components/WilayaSelector";
import LocationPicker from "@/components/LocationPicker";
import { Select } from "@/components/ui/select";
import { Trash2, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SellerProducts() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { isSeller } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [photos, setPhotos] = useState<string[]>(["", "", ""]);
  const [coverPhoto, setCoverPhoto] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [eventLocation, setEventLocation] = useState<{lat:number;lng:number;address:string}|null>(null);
  const [location, setLocation2] = useState<{lat:number;lng:number;address:string}|null>(null);

  useEffect(() => {
    if (!isSeller) setLocation("/");
  }, [isSeller]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiFetch("/api/categories");
      if (!res.ok) throw new Error("Erreur catégories");
      return res.json();
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["sellerProducts"],
    queryFn: async () => {
      const res = await apiFetch("/api/seller/products");
      if (!res.ok) throw new Error("Erreur produits");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { title, description, price: Number(price), coverPhoto, photos: photos.filter(Boolean), categoryId, wilayaId, location: location ? JSON.stringify(location) : null };
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Erreur sauvegarde");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sellerProducts"]);
      setTitle("");
      setDescription("");
      setPrice(0);
      setPhotos(["", "", ""]);
      setCoverPhoto("");
      setCategoryId(null);
      setWilayaId(null);
      setLocation2(null);
      setEditingId(null);
      toast({ title: "Succès", description: "Produit enregistré.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le produit.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiFetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sellerProducts"]);
      toast({ title: "Supprimé", description: "Produit supprimé.", variant: "success" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" });
    },
  });

  const setEditProduct = (product: any) => {
    setEditingId(product.id);
    setTitle(product.title || "");
    setDescription(product.description || "");
    setPrice(Number(product.price) || 0);
    setPhotos([...product.photos, "", "", "", "", ""].slice(0, 5));
    setCoverPhoto(product.coverPhoto || "");
    setCategoryId(product.categoryId);
    setWilayaId(product.wilayaId);
    setEventLocation(product.location ? JSON.parse(product.location) : null);
    setLocation2(product.location ? JSON.parse(product.location) : null);
  };

  const photoControls = photos.map((photo, index) => (
    <div key={index} className="space-y-2">
      <Input value={photo} onChange={(event) => {
        const next = [...photos];
        next[index] = event.target.value;
        setPhotos(next);
      }} placeholder={`Photo ${index + 1} URL`} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="radio"
          name="coverPhoto"
          value={photo}
          checked={coverPhoto === photo}
          onChange={() => setCoverPhoto(photo)}
          disabled={!photo}
        />
        <span>Photo de couverture</span>
      </div>
    </div>
  ));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{t("my_products")}</h1>
          <p className="text-sm text-muted-foreground">{t("manage_products")}</p>
        </div>
        <Button onClick={() => setEditingId(null)}>{t("add_product")}</Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? "Modifier le produit" : "Ajouter un produit"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre" />
            <Input type="number" min={0} value={price || ""} onChange={(event) => setPrice(Number(event.target.value) || 0)} placeholder="Prix (DZD)" />
          </div>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Select value={categoryId ?? ""} onValueChange={(value) => setCategoryId(value ? Number(value) : null)}>
              <option value="">Catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name_fr ?? category.name}</option>
              ))}
            </Select>
            <WilayaSelector value={wilayaId} onChange={setWilayaId} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              📍 Localisation de l'événement <span className="text-xs text-muted-foreground">(optionnel — pour événements physiques)</span>
            </label>
            <LocationPicker value={eventLocation} onChange={setEventLocation} />
          </div>
          {/* Localisation pour evenements physiques */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              📍 Localisation de votre evenement <span className="text-xs text-muted-foreground">(optionnel)</span>
            </label>
            <LocationPicker value={location} onChange={setLocation2} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {photoControls}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}>
              {editingId ? "Mettre à jour" : "Créer le produit"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={() => setEditingId(null)}>Annuler</Button>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">Minimum 3 photos, maximum 5. La photo de couverture doit être sélectionnée parmi les photos ajoutées.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {productsLoading ? (
          [...Array(3)].map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-700">Aucun produit trouvé.</div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.4fr]">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{product.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    </div>
                    <div className="grid gap-2 text-right">
                      <span className="text-lg font-semibold">{Number(product.price).toLocaleString()} DZD</span>
                      <Badge>{product.status}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>{product.views ?? 0} vues</span>
                    <span>{product.photos?.length ?? 0} photos</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <Button variant="outline" onClick={() => setEditProduct(product)} className="flex-1 gap-2"><Edit className="h-4 w-4" />Modifier</Button>
                  <Button variant="destructive" onClick={() => deleteMutation.mutate(product.id)} className="flex-1 gap-2"><Trash2 className="h-4 w-4" />Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
