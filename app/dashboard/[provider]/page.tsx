import { Dashboard } from "@/components/dashboard";
import { Navigation } from "@/components/navigation";
import { getUsersData } from "@/lib/redis-actions";
import { updateUserLimit } from "@/lib/neon-actions";
import { getUsersUsage } from "@/lib/utils";
import { notFound } from "next/navigation";

type Params = Promise<{ provider: string }>;

export const dynamic = "force-dynamic";
const providers = ["openai", "anthropic", "togetherai", "google"];

export default async function ProviderPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  if (!providers.includes(params.provider)) {
    notFound();
  }
  const usersData = await getUsersData();
  const users = await getUsersUsage(usersData, params.provider);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{params.provider.charAt(0).toUpperCase() + params.provider.slice(1)} Dashboard</h1>
      <Navigation />
      <Dashboard initialUsers={users} modelFamily={params.provider} updateUserLimit={updateUserLimit} />
    </div>
  );
}
