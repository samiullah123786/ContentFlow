import { supabase } from "@/lib/supabase";
import TaskDetailsClient from "./client";
import { Metadata } from "next";

type Props = {
  params: { id: string };
};

// This is a server component that will be rendered at build time
export default function TaskDetailsPage({ params }: Props) {
  return <TaskDetailsClient id={params.id} />;
}

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Task Details - ${params.id}`,
    description: "View and edit task details",
  };
}

// This function tells Next.js which paths to pre-render
export async function generateStaticParams() {
  try {
    // Fetch all task IDs from the database
    const { data } = await supabase.from("tasks").select("id");

    // Return an array of objects with the id parameter
    return (data || []).map((task) => ({
      id: task.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params for tasks:", error);
    return [];
  }
}
