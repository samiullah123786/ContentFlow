import { supabase } from "@/lib/supabase";
import ClientDetailsClient from "./client";
import { Metadata } from "next";

type Props = {
  params: { id: string };
};

// This is a server component that will be rendered at build time
export default async function ClientDetailsPage({ params }: Props) {
  // In Next.js 13+, we need to properly handle params in an async context
  const id = params?.id;
  return <ClientDetailsClient id={id} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Extract the id from params to avoid the async params warning
  const id = params?.id;
  return {
    title: `Client Details - ${id}`,
    description: "View and edit client details",
  };
}

// This function tells Next.js which paths to pre-render
export async function generateStaticParams() {
  try {
    // Fetch all client IDs from the database
    const { data } = await supabase.from("clients").select("id");

    // Return an array of objects with the id parameter
    return (data || []).map((client) => ({
      id: client.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params for clients:", error);
    return [];
  }
}
