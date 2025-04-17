import { supabase } from "@/lib/supabase";
import WorkDetailsClient from "./client";
import { Metadata } from "next";

type Props = {
  params: { id: string };
};

// This is a server component that will be rendered at build time
export default function WorkDetailsPage({ params }: Props) {
  return <WorkDetailsClient id={params.id} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Work Details - ${params.id}`,
    description: "View and edit work details",
  };
}

// This function tells Next.js which paths to pre-render
export async function generateStaticParams() {
  try {
    // Fetch all work IDs from the database
    const { data } = await supabase.from("works").select("id");
    
    // Return an array of objects with the id parameter
    return (data || []).map((work) => ({
      id: work.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params for works:", error);
    return [];
  }
}
