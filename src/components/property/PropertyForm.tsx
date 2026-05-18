import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DISTRICTS, AMENITIES } from "@/lib/format";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

export interface PropertyFormValues {
  id?: string;
  title?: string;
  description?: string;
  property_type?: string;
  purpose?: string;
  price_mwk?: number;
  location?: string;
  district?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number | null;
  amenities?: string[];
  cover_image?: string | null;
  images?: string[];
  status?: string;
}

export function PropertyForm({ initial, onDone }: { initial?: PropertyFormValues; onDone: (id: string) => void }) {
  const { user, isApprovedLandlord, hasActiveLandlordSub } = useAuth();
  const [v, setV] = useState<PropertyFormValues>({
    property_type: "house", purpose: "rent", bedrooms: 2, bathrooms: 1, amenities: [], images: [], ...initial,
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k: keyof PropertyFormValues, val: any) => setV((s) => ({ ...s, [k]: val }));

  async function uploadFiles(files: FileList) {
    if (!user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const path = `${user.id}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from("property-media").upload(path, f, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("property-media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setV((s) => ({ ...s, images: [...(s.images ?? []), ...urls], cover_image: s.cover_image || urls[0] }));
    setUploading(false);
  }

  async function save(publish: boolean) {
    if (!user) return;
    setBusy(true);
    const status = publish ? (isApprovedLandlord && hasActiveLandlordSub ? "active" : "draft") : "draft";
    if (publish && status === "draft") toast.warning("Saved as draft. Activate your subscription to publish.");

    const payload = {
      owner_id: user.id,
      title: v.title!, description: v.description ?? "", property_type: v.property_type as any,
      purpose: v.purpose as any, price_mwk: Number(v.price_mwk), location: v.location!, district: v.district!,
      bedrooms: Number(v.bedrooms ?? 0), bathrooms: Number(v.bathrooms ?? 0), sqft: v.sqft ? Number(v.sqft) : null,
      amenities: v.amenities ?? [], cover_image: v.cover_image ?? v.images?.[0] ?? null, images: v.images ?? [],
      status: status as any,
    };

    let id = v.id;
    if (id) {
      const { error } = await supabase.from("properties").update(payload).eq("id", id);
      if (error) { setBusy(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("properties").insert(payload).select("id").single();
      if (error) { setBusy(false); return toast.error(error.message); }
      id = data.id;
    }
    setBusy(false);
    toast.success(publish && status === "active" ? "Published!" : "Saved");
    onDone(id!);
  }

  const removeImg = (url: string) => setV((s) => ({
    ...s, images: (s.images ?? []).filter((x) => x !== url),
    cover_image: s.cover_image === url ? (s.images?.find((x) => x !== url) ?? null) : s.cover_image,
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label>Title *</Label><Input value={v.title ?? ""} onChange={(e) => set("title", e.target.value)} required maxLength={120} /></div>
        <div><Label>Purpose *</Label>
          <Select value={v.purpose} onValueChange={(x) => set("purpose", x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="rent">For rent</SelectItem><SelectItem value="sale">For sale</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Type *</Label>
          <Select value={v.property_type} onValueChange={(x) => set("property_type", x)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem><SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="villa">Villa</SelectItem><SelectItem value="land">Land</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem><SelectItem value="office">Office</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Price (MWK) *</Label><Input type="number" min={0} value={v.price_mwk ?? ""} onChange={(e) => set("price_mwk", e.target.value)} required /></div>
        <div><Label>District *</Label>
          <Select value={v.district} onValueChange={(x) => set("district", x)}>
            <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
            <SelectContent>{DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2"><Label>Location / Area *</Label><Input value={v.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Area 47, Lilongwe" required /></div>
        <div><Label>Bedrooms</Label><Input type="number" min={0} value={v.bedrooms ?? 0} onChange={(e) => set("bedrooms", e.target.value)} /></div>
        <div><Label>Bathrooms</Label><Input type="number" min={0} value={v.bathrooms ?? 0} onChange={(e) => set("bathrooms", e.target.value)} /></div>
        <div><Label>Area (ft²)</Label><Input type="number" min={0} value={v.sqft ?? ""} onChange={(e) => set("sqft", e.target.value || null)} /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={5} value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} maxLength={5000} /></div>
      </div>

      <div>
        <Label className="mb-2 block">Amenities</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 cursor-pointer text-sm">
              <Checkbox checked={v.amenities?.includes(a)} onCheckedChange={(c) =>
                set("amenities", c ? [...(v.amenities ?? []), a] : (v.amenities ?? []).filter((x) => x !== a))
              } />
              {a}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Images</Label>
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary transition">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">{uploading ? "Uploading…" : "Click to upload (high-resolution)"}</div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        </label>
        {(v.images?.length ?? 0) > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
            {v.images!.map((url) => (
              <div key={url} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${v.cover_image===url?"border-primary":"border-transparent"}`}>
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button onClick={() => set("cover_image", url)} className="absolute top-1 left-1 rounded-md bg-black/60 text-white text-[10px] uppercase px-1.5 py-0.5">{v.cover_image===url?"Cover":"Set cover"}</button>
                <button onClick={() => removeImg(url)} className="absolute top-1 right-1 rounded-md bg-destructive/90 text-white p-1"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save(false)} variant="outline" disabled={busy}>Save draft</Button>
        <Button onClick={() => save(true)} className="bg-gradient-primary" disabled={busy}>
          {isApprovedLandlord && hasActiveLandlordSub ? "Save & publish" : "Save (will publish after subscription)"}
        </Button>
      </div>
    </div>
  );
}
