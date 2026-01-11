"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Store } from "lucide-react";
import { createRestaurantMetadata } from "@/server/restaurants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
  address: z.string().min(5).max(200),
  phone: z.string().min(10).max(20),
  cuisineType: z.string().optional(),
  seatingCapacity: z.string().optional(),
});

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
}

export function CreateOrganizationForm({
  onSuccess,
}: CreateOrganizationFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      address: "",
      phone: "",
      cuisineType: "",
      seatingCapacity: "",
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setValue("slug", slug);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // Create organization with restaurant metadata
      const orgResponse = await authClient.organization.create({
        name: values.name,
        slug: values.slug,
        metadata: {
          address: values.address,
          phone: values.phone,
          cuisineType: values.cuisineType || null,
          seatingCapacity: values.seatingCapacity
            ? parseInt(values.seatingCapacity)
            : null,
          type: "restaurant", // Mark this as a restaurant organization
        },
      });

      if (orgResponse?.error) {
        throw new Error(
          orgResponse.error.message || "Failed to create organization"
        );
      }

      // Create restaurant metadata record in database
      // orgResponse.data is the organization object itself
      if (orgResponse?.data?.id) {
        const metadataResponse = await createRestaurantMetadata({
          organizationId: orgResponse.data.id,
          address: values.address,
          phone: values.phone,
          cuisineType: values.cuisineType || null,
          seatingCapacity: values.seatingCapacity
            ? parseInt(values.seatingCapacity)
            : null,
        });

        if (!metadataResponse.success) {
          console.error(
            "Failed to create restaurant metadata:",
            metadataResponse.error
          );
          // Don't fail the entire process if metadata creation fails
          toast.error(
            "Restaurant created but some details may not be saved correctly"
          );
        }
      }

      toast.success("Restaurant created successfully");
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create restaurant"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Set up your restaurant to get started
            </p>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Basic Information
            </h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mario's Italian Bistro"
                        className="h-10"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="marios-italian-bistro"
                        className="h-10 font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be used in your restaurant&apos URL:
                      /restaurant/
                      {field.value || "your-slug"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Location & Contact Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Location & Contact
            </h4>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Main St, City, State 12345"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(555) 123-4567"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Restaurant Details Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Restaurant Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cuisineType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Cuisine Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select cuisine type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="american">🇺🇸 American</SelectItem>
                        <SelectItem value="italian">🇮🇹 Italian</SelectItem>
                        <SelectItem value="mexican">🇲🇽 Mexican</SelectItem>
                        <SelectItem value="asian">🥢 Asian</SelectItem>
                        <SelectItem value="chinese">🇨🇳 Chinese</SelectItem>
                        <SelectItem value="indian">🇮🇳 Indian</SelectItem>
                        <SelectItem value="french">🇫🇷 French</SelectItem>
                        <SelectItem value="japanese">🇯🇵 Japanese</SelectItem>
                        <SelectItem value="thai">🇹🇭 Thai</SelectItem>
                        <SelectItem value="seafood">🦞 Seafood</SelectItem>
                        <SelectItem value="steakhouse">
                          🥩 Steakhouse
                        </SelectItem>
                        <SelectItem value="pizza">🍕 Pizza</SelectItem>
                        <SelectItem value="fast-casual">
                          ⚡ Fast Casual
                        </SelectItem>
                        <SelectItem value="fine-dining">
                          ✨ Fine Dining
                        </SelectItem>
                        <SelectItem value="cafe">☕ Cafe</SelectItem>
                        <SelectItem value="bakery">🥖 Bakery</SelectItem>
                        <SelectItem value="other">🍽️ Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Optional - helps categorize your restaurant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seatingCapacity"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Seating Capacity</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="50"
                        type="number"
                        min="1"
                        max="1000"
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional - total number of seats
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t">
          <Button
            disabled={isLoading}
            type="submit"
            className="w-full h-11 text-base font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Restaurant...
              </>
            ) : (
              <>
                <Store className="mr-2 h-4 w-4" />
                Create Restaurant
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
