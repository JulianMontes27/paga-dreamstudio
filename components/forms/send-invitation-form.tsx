"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

// ✅ Validation schema
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["member", "admin"], {
    message: "Please select a role.",
  }),
});

interface SendInvitationFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function SendInvitationForm({
  organizationId,
  onSuccess,
}: SendInvitationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: activeOrg } = authClient.useActiveOrganization();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
    mode: "onBlur", // ✅ validate earlier, better UX
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.organization.inviteMember({
        email: values.email,
        role: values.role,
        organizationId: organizationId || activeOrg?.id,
      });

      if (error) throw error;

      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 animate-in fade-in-50"
        >
          {/* Email field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email" // ✅ match htmlFor
                      type="email"
                      autoComplete="off"
                      placeholder="team@restaurant.com"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Enter the email of the team member you want to invite.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role field */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex flex-col">
                        <span className="font-medium">Member</span>
                        <span className="text-sm text-muted-foreground">
                          Basic access to restaurant operations
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span className="font-medium">Admin</span>
                        <span className="text-sm text-muted-foreground">
                          Full access to manage restaurant settings
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assign appropriate permissions to this team member.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
