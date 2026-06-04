import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/utils";

interface WilayaSelectorProps {
  value: number | null;
  onChange: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function WilayaSelector({ value, onChange, placeholder = "Choisir une wilaya", disabled = false, className = "" }: WilayaSelectorProps) {
  const { data: wilayas = [] } = useQuery<any[]>({
    queryKey: ["/api/wilayas"],
    queryFn: async () => {
      const res = await apifetch((import.meta.env.VITE_API_URL || "") + "/api/wilayas");
      if (!res.ok) throw new Error("Erreur chargement wilayas");
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.wilayas)) return data.wilayas;
      if (Array.isArray(data.data)) return data.data;
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const sorted = [...wilayas].sort((a, b) => Number(a.code) - Number(b.code));

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className={"h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring " + className}
      size={1}
    >
      <option value="">{placeholder}</option>
      {sorted.map((w) => (
        <option key={w.id} value={w.id}>
          {String(w.code).padStart(2, "0")} - {w.name_fr ?? w.name}
        </option>
      ))}
    </select>
  );
}

