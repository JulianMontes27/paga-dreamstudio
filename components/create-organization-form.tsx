"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface CreateOrganizationFormProps {
  onSuccess: () => void;
}

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo: "",
  });

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    setFormData({ ...formData, name, slug });
    setSlugAvailable(null); // Reset validation when name changes
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      const { data, error } = await authClient.organization.checkSlug({
        slug,
      });

      if (error) {
        console.error("Error checking slug:", error);
        setSlugAvailable(null);
        return;
      }

      setSlugAvailable(data?.status ?? null);
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase();
    setFormData({ ...formData, slug });
    setSlugAvailable(null);
  };

  const handleSlugBlur = () => {
    if (formData.slug) {
      checkSlugAvailability(formData.slug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Double-check slug availability before submitting
      if (slugAvailable !== true) {
        await checkSlugAvailability(formData.slug);
        // Wait a bit for the check to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Create the organization
      const { data, error } = await authClient.organization.create({
        name: formData.name,
        slug: formData.slug,
        logo: formData.logo || undefined,
      });

      if (error) {
        console.error("Error creating organization:", error);
        toast.error(error.message || "Error al crear la organización");
        return;
      }

      if (data) {
        toast.success("Organización creada exitosamente");
        router.refresh();
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Error al crear la organización");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre de la organización <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Mi Organización"
          value={formData.name}
          onChange={handleNameChange}
          required
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          Identificador único (slug) <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="slug"
            type="text"
            placeholder="mi-organizacion"
            value={formData.slug}
            onChange={handleSlugChange}
            onBlur={handleSlugBlur}
            required
            disabled={isLoading}
            className="w-full pr-10"
          />
          {isCheckingSlug && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isCheckingSlug && slugAvailable === true && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          )}
          {!isCheckingSlug && slugAvailable === false && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        {slugAvailable === false && (
          <p className="text-xs text-destructive">
            Este slug ya está en uso. Por favor, elige otro.
          </p>
        )}
        {slugAvailable === true && (
          <p className="text-xs text-green-600">¡Slug disponible!</p>
        )}
        <p className="text-xs text-muted-foreground">
          Este será usado en URLs: hunt-tickets.com/org/{formData.slug || "..."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo (URL)</Label>
        <Input
          id="logo"
          type="url"
          placeholder="https://ejemplo.com/logo.png"
          value={formData.logo}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
          disabled={isLoading}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Opcional: URL de la imagen del logo de tu organización
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button
          type="submit"
          disabled={
            isLoading ||
            slugAvailable === false ||
            !formData.name ||
            !formData.slug
          }
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear Organización"
          )}
        </Button>
      </div>
    </form>
  );
}
